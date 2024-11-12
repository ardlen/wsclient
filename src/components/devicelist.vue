<template>
  <div class="q-pa-md">
    <q-table
      class="my-sticky-dynamic"
      title="Зарегистрированные устройства"
      :data="data"
      :columns="columns"
      row-key="deveui"
      :selected-rows-label="getSelectedString"
      selection="multiple"
      :selected.sync="selected"
      :filter="filter"
      @focusin.native="activateNavigation"
      @focusout.native="deactivateNavigation"
      @keydown.native="onKey"
      @click="onRowClick"
      separator="vertical"
      no-data-label="Нет активных устройств "
      flat
    >
      <template v-slot:top-right>
        <q-input
          borderless
          dense
          debounce="300"
          v-model="filter"
          placeholder="Данные акт.устройств"
        >
          <template v-slot:append>
            <q-icon name="search" />
          </template>
        </q-input>
      </template>
      <template v-slot:body="props">
        <q-tr :props="props" @click="onRowClick(props)">
          <q-td>
            <q-checkbox v-model="props.selected" color="primary" />
          </q-td>
          <q-td key="deveui" :props="props">{{ props.row.deveui }}</q-td>
          <q-chip
            :label="props.row.status"
            :color="getStatusColor(props.row.status)"
            size="auto"
            text-color="white"
          />
          <!-- <q-td key="status" :props="props"> {{ props.row.status }}</q-td> -->
          <q-td key="data_time" :props="props">{{ props.row.data_time }}</q-td>
          <q-td key="gps" :props="props">{{ props.row.gps }}</q-td>
          <q-td key="cmd" :props="props">{{ props.row.cmd }}</q-td>
          <q-td key="data_beacon" :props="props">{{
            props.row.data_beacon
          }}</q-td>
        </q-tr>
      </template>
    </q-table>

    <!-- <div class="q-mt-md">Selected: {{ JSON.stringify(selected) }}</div> -->
    <template>
      <q-dialog v-model="prompt" persistent>
        <q-card style="min-width: 210px">
          <q-card-section>
            <div class="text-h7">Команда : {{ l_deveui }}</div>
          </q-card-section>

          <q-card-section class="q-pt-none">
            <q-input
              dense
              v-model="command"
              autofocus
              @keyup.enter="prompt = false"
            />
          </q-card-section>

          <q-card-actions align="right" class="text-primary">
            <q-btn flat label="Отмена" v-close-popup />
            <q-btn flat label="Выполнить" v-close-popup @click="onClickcmd" />
          </q-card-actions>
        </q-card>
      </q-dialog>
    </template>
  </div>
</template>

<script>
/*eslint-disable */
import moment from "moment";
import { mapGetters } from "vuex";

export default {
  name: "devicelist",

  data() {
    return {
      count_dev: 0,
      DeviceActive: false,
      prompt: false,
      sendcmd: true,
      dev_table_data: [],
      device_data: [],
      command: "",
      l_deveui: "",
      deveui_a: [],
      navigationActive: false,
      filter: "",
      selected: [],
      pagination: {},
      separator: "vertical",
      columns: [
        {
          name: "deveui",
          required: true,
          label: "ID устр.",
          align: "left",
          field: (row) => row.deveui,
          format: (val) => `${val}`,
          sortable: true,
          classes: "bg-grey-1 ellipsis",
          style: "width: 90px",
          headerClasses: "bg-primary text-white",
        },
        {
          name: "status",
          required: true,
          label: "Акт.",
          align: "centr",
          field: "status",
          sortable: true,
          classes: "bg-grey-1 ellipsis",
          style: "width: 1px",
          headerClasses: "bg-primary text-white",
        },
        {
          name: "data_time",
          label: "Дата/время",
          align: "left",
          field: "data_time",
          sortable: true,
          style: "width:10px",
          headerClasses: "bg-blue-1 ellipsis",
        },
        {
          name: "gps",
          align: "left",
          label: "Глонасс",
          field: "gps",
          headerClasses: "bg-blue-1 ellipsis",
        },
        {
          name: "cmd",
          label: "Kоманда",
          align: "left",
          field: "cmd",
          sortable: true,
          headerClasses: "bg-blue-1 ellipsis",
        },

        {
          name: "data_beacon",
          label: "Данные маяков",
          align: "left",
          field: "data_beacon",
          headerClasses: "bg-blue-1 ellipsis",
        },
      ],
      data: [],
      data_ar: [],
      intervalId: null, // Для хранения ID интервала
      wait_sec: 0,
      dept_in_sec: 0,
      dept_in_sec_act: 0,
    };
  },

  mounted() {
    // Запускаем фоновое задание каждые wait_in_sec  секунд
    if (localStorage.wait_in_sec) {
      this.wait_sec = JSON.parse(localStorage.wait_in_sec);
    }
    if (localStorage.dept_in_sec) {
      this.dept_in_sec = JSON.parse(localStorage.dept_in_sec);
      this.dept_in_sec *= this.wait_sec;
    }
    if (localStorage.dept_in_sec_act) {
      this.dept_in_sec_act = JSON.parse(localStorage.dept_in_sec_act);
      this.dept_in_sec_act += this.dept_in_sec;
    }

    this.intervalId = setInterval(() => {
      this.check_update_data(this.data);
    }, this.wait_sec * 1000);
  },

  beforeDestroy() {
    // Очищаем интервал при уничтожении компонента
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
    console.log(`clearInterval ${this.intervalId}`);
  },

  created() {
    // Devices that were in the last session
    if (localStorage.data_dev_list) {
      this.data = JSON.parse(localStorage.data_dev_list);
      this.data.forEach((element) => {
        element.status = "A";
      });
    }
  },

  computed: {
    ...mapGetters({
      messageIoT: "store/messageIoT",
      GsendCmdC: "store/GsendCmdC",
    }),
    tableClass() {
      return this.navigationActive === true ? "shadow-8 no-outline" : void 0;
    },
  },
  watch: {
    // Handling the data receiving event
    messageIoT: function (val) {
      console.log("val", val);
      this.fetchData(val);
    },
  },
  methods: {
    check_update_data(data) {
      var currentTime = moment();
      data.forEach((element) => {
        let rec = moment(element.data_time, "HH:mm:ss");

        if (
          currentTime.diff(moment(rec, "HH:mm:ss"), "seconds") >=
          this.dept_in_sec
        ) {
          element.status = "A";
        }
        if (
          currentTime.diff(moment(rec, "HH:mm:ss"), "seconds") >=
          this.dept_in_sec_act
        ) {
          element.status = "N";
        }
      });
    },

    getStatusColor(status) {
      if (status === "Up") {
        return "green";
      } else if (status === "A") {
        return "blue";
      } else if (status === "N") {
        return "red";
      }
      return "grey";
    },
    // Save command for further send to device
    onClickcmd() {
      console.log("clicked on", this.l_deveui, this.command);
      this.cmdSend(this.l_deveui, this.command);
    },
    update(value) {
      console.log(value);
    },
    onRowClick(props) {
      this.l_deveui = props.key;
      this.deveui_a = props;
      this.prompt = true;
      this.cmd_mode = true;
      console.log("clicked on", props, this.command);
    },

    getSelectedString() {
      return this.selected.length === 0
        ? ""
        : `${this.selected.length} record${
            this.selected.length > 1 ? "s" : ""
          } selected of ${this.data.length}`;
    },
    activateNavigation() {
      this.navigationActive = true;
    },

    deactivateNavigation() {
      this.navigationActive = false;
    },

    onKey(evt) {
      if (
        this.navigationActive !== true ||
        [33, 34, 35, 36, 38, 40].indexOf(evt.keyCode) === -1 ||
        this.$refs.myTable === void 0
      ) {
        return;
      }

      evt.preventDefault();

      const { computedRowsNumber, computedRows } = this.$refs.myTable;

      if (computedRows.length === 0) {
        return;
      }

      const currentIndex =
        this.selected.length > 0 ? computedRows.indexOf(this.selected[0]) : -1;
      const currentPage = this.pagination.page;
      const rowsPerPage =
        this.pagination.rowsPerPage === 0
          ? computedRowsNumber
          : this.pagination.rowsPerPage;
      const lastIndex = computedRows.length - 1;
      const lastPage = Math.ceil(computedRowsNumber / rowsPerPage);

      let index = currentIndex;
      let page = currentPage;

      switch (evt.keyCode) {
        case 36: // Home
          page = 1;
          index = 0;
          break;
        case 35: // End
          page = lastPage;
          index = rowsPerPage - 1;
          break;
        case 33: // PageUp
          page = currentPage <= 1 ? lastPage : currentPage - 1;
          if (index < 0) {
            index = 0;
          }
          break;
        case 34: // PageDown
          page = currentPage >= lastPage ? 1 : currentPage + 1;
          if (index < 0) {
            index = rowsPerPage - 1;
          }
          break;
        case 38: // ArrowUp
          if (currentIndex <= 0) {
            page = currentPage <= 1 ? lastPage : currentPage - 1;
            index = rowsPerPage - 1;
          } else {
            index = currentIndex - 1;
          }
          break;
        case 40: // ArrowDown
          if (currentIndex >= lastIndex) {
            page = currentPage >= lastPage ? 1 : currentPage + 1;
            index = 0;
          } else {
            index = currentIndex + 1;
          }
          break;
      }

      if (page !== this.pagination.page) {
        this.pagination = {
          ...this.pagination,
          page,
        };

        this.$nextTick(() => {
          const { computedRows } = this.$refs.myTable;
          this.selected = [
            computedRows[Math.min(index, computedRows.length - 1)],
          ];
        });
      } else {
        this.selected = [computedRows[index]];
      }
    },

    beacon_str(val) {
      let beacon_str = [];
      val.DataContext.forEach((element) => {
        beacon_str.push(element);
      });

      return beacon_str;
    },

    fetchData(val) {
      // initial state for array data table
      if (this.data.length == 0) {
        this.data.push({
          deveui: val.DevEui,
          status: "A",
          data_time: moment().format("HH:mm:ss"),
          cmd: val.Pos[0].Cmd,
          gps: String(val.Pos[0].Ns).concat(":", String(val.Pos[0].Ew)),
          data_beacon: this.beacon_str(val),
        });
      } else {
        // Check exist device id in data table array
        let res = this.data.filter(function (data) {
          return data.deveui === val.DevEui;
        });
        // If found the deviee id in data table array, to update array values from recived data
        if (res.length !== 0 && val.DevEui !== "") {
          let idx = this.data.findIndex(function (data) {
            return data.deveui === val.DevEui;
          });
          (this.data[idx].status = "Up"),
            (this.data[idx].data_time = moment().format("HH:mm:ss")),
            (this.data[idx].cmd = val.Pos[0].Cmd),
            ((this.data[idx].gps = String(val.Pos[0].Ns).concat(
              ":",
              String(val.Pos[0].Ew)
            )),
            (this.data[idx].data_beacon = this.beacon_str(val)));

          console.log("Tracker is skipped:", val.DevEui, idx);
          console.log("device_data :", this.data);
          this.getStatusColor();
        } else {
          // If the device id not found in the data table array,add a new array element
          this.data.push({
            deveui: val.DevEui,
            status: "A",
            data_time: moment().format(`LTS`),
            cmd: val.Pos[0].Cmd,
            gps: String(val.Pos[0].Ns).concat(":", String(val.Pos[0].Ew)),
            data_beacon: this.beacon_str(val),
          });
          console.log("Tracker is added :", val.DevEui);
        }
      }
      // Save data in local storage
      localStorage.data_dev_list = JSON.stringify(this.data);
    },
    cmdSend(id, cmd) {
      let ctxs = {
        idtracker: id,
        cmd: parseInt(cmd),
      };
      this.$store.dispatch("store/cmdSend", ctxs);
    },
  },
};
</script>
<style lang="sass">
.my-sticky-dynamic
  /* height or max-height is important */
  height: 510px
  .q-table__top,
  .q-table__bottom,
  thead tr:first-child th /* bg color is important for th; just specify one */
    background-color: #fff

  thead tr th
    position: sticky
    z-index: 1
  /* this will be the loading indicator */
  thead tr:last-child th
    /* height of all previous header rows */
    top: 48px
  thead tr:first-child th
    top: 0

  /* prevent scrolling behind sticky top row on focus */
  tbody
    /* height of all previous header rows */
    scroll-margin-top: 48px
</style>
<style lang="sass" scoped>
.row > div
  padding: 10px 15px
  background: rgba(86,61,124,.15)
  border: 1px solid rgba(86,61,124,.2)
.row + .row
  margin-top: 1rem
</style>

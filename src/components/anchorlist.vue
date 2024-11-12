<template>
  <div class="q-pa-md" style="padding-left: 0">
    <q-table
      flat
      bordered
      title="Список маяков"
      :data="rows"
      row-key="m"
      :columns="columns"
      selection="single"
      :selected.sync="selected"
      no-data-label="Данных по маякам нет"
      dense
    >
      <template v-slot:body="props">
        <q-tr :props="props">
          <q-td>
            <q-checkbox v-model="props.selected" color="primary" />
          </q-td>
          <q-td key="m" :props="props">{{ props.row.m }}</q-td>
          <q-td key="mgmn" :props="props">
            {{ props.row.mgmn }}

            <q-popup-edit
              v-if="selected.length > 0"
              v-model="props.row.mgmn"
              v-slot="scope"
            >
              <q-input
                v-model="scope.value"
                dense
                autofocus
                @keyup.enter="scope.set"
                @change="update_anchor"
              />
            </q-popup-edit>
          </q-td>
          <q-td key="a_pos" :props="props">{{ props.row.a_pos }}</q-td>
        </q-tr>
      </template>
    </q-table>

    <template v-if="selected.length != 0">
      <div class="q-pa-md q-gutter-sm" style="padding-left: 0">
        <q-btn @click="del_anchor" color="primary" label="Уд. маяк" />
      </div>
    </template>

    <div>
      <slot :fetchData="fetchData" />
    </div>
  </div>
</template>

<script>
/*eslint-disable */

const columns = [
  {
    name: "m",
    required: true,
    label: "ID маяка",
    align: "centr",
    field: (row) => row.m,
    format: (val) => `${val}`,
    style: "width: 10px",
    sortable: true,
  },
  {
    name: "mgmn",
    align: "center",
    label: "Mg/Mn",
    field: "mgmn",
    style: "width: 130px",
    sortable: true,
  },
  {
    name: "a_pos",
    align: "centr",
    label: "Координаты маяка",
    field: "a_pos",
    sortable: true,
  },
];
export default {
  props: ["onEventListUpdate", "onUpdateLIst"],
  data() {
    return {
      columns,
      selected: [],
      rows: [],
    };
  },

  mounted() {
    this.initAnchorList();
  },

  methods: {
    initAnchorList() {
      if (localStorage.anchors) {
        this.rows = JSON.parse(localStorage.anchors);
      }
    },
    fetchData(val) {
      this.rows = val;
      console.log("Fired event from child-->>", this.rows);
    },

    update_anchor(props) {
      let val_chg = { m: this.selected[0].m, mgmn: props.target._value };
      this.onUpdateLIst(val_chg);
      Notify.create({ message: "Установки сохранены ", type: "positive" });
    },
    del_anchor() {
      this.initAnchorList();
      if (this.onEventListUpdate) {
        let idx = this.rows.findIndex((r) => r.m === this.selected[0].m);
        this.rows.splice(idx, 1);
        console.log(" Selected this.rows", idx, this.selected[0]);
        this.onEventListUpdate(this.selected[0].m);
      }
    },
  },
};
</script>

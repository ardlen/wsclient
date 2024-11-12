<template>
  <q-page class="q-pa-md">
    <div style="display: flex; margin-bottom: 10px">
      <template v-if="connectedDevice === false">
        <q-chip color="gray" text-color="black" icon="explore_off">
          Устройства не подключены
        </q-chip>
      </template>
      <template v-else>
        <q-chip color="green" text-color="white" icon="explore">
          Устройства в работе
        </q-chip>
        <template v-if="sendcmd === true">
          <q-spinner-radio color="green" size="2em" />
          <q-tooltip :offset="[0, 8]"> Команда отправлена </q-tooltip>
        </template>
      </template>
      <div class="q-gutter-sm">
        <q-checkbox
          v-model="selected"
          label="Устновить центр контроля в ручyную"
          color="teal"
        />
      </div>
    </div>
    <GmapMap
      :center="center"
      :zoom="zoom"
      :clickable="true"
      style="width: 100%; height: 1000px"
      ref="mapRef"
      @dragend="hadleDrag"
    >
      <gmap-custom-marker
        v-for="(marker, i) in markers"
        :key="marker._id"
        :marker="marker.type !== 'Base' ? marker.position : marker.position"
        :draggable="true"
        @click.native="cmdSend(i)"
      >
        <template v-if="marker.type === 'Base'">
          <img class="icon" src="~/assets/monitor.png" height="33" />
        </template>
        <template v-else>
          <img
            class="icon"
            src="~/assets/20_20_worker-marker.png"
            height="30"
          />
        </template>
      </gmap-custom-marker>
    </GmapMap>
  </q-page>
</template>
<script>
/*eslint-disable */

import { mapState, mapActions, mapGetters } from "vuex";

import Vue from "vue";
import * as VueGoogleMaps from "gmap-vue";
import GmapCustomMarker from "vue2-gmap-custom-marker";
import { gmapApi } from "vue2-google-maps";
import VueGeoloctaion from "vue-browser-geolocation";

Vue.use(VueGeoloctaion);
Vue.use(VueGoogleMaps, {
  load: {
    key: "AIzaSyDY-ei_cQESBtMgIf_NjTBxbHqmLWwm_m0",
  },
});

export default {
  name: "Map",
  components: {
    "gmap-custom-marker": GmapCustomMarker,
    "vue2-google-maps": gmapApi,
    "gmap-vue": VueGoogleMaps,
  },

  data() {
    return {
      mov_marker: { lat: 0, lng: 0 },
      map: null,
      gmap: null,
      regtracker: 0,
      center: { lat: 0, lng: 0 },
      basePoint: null,
      zoom: 12,
      markers: [],

      marker: {
        position: null,
        map: null,
        title: null,
        shape: null,
        id_tr: null,
        cmd: Int8Array,
        type: null,
      },
      connectedDevice: false,
      sendcmd: false,
      setBasepoint: false,
      selected: false,
      listenerHandle: null,
      mr: [],
    };
  },

  created() {
    // Если нет начальных координат центра мониторинга
    if (localStorage.center) {
      this.center = JSON.parse(localStorage.center);
    } else {
      alert("Получаю текущую геопозицию");
      this.$getLocation({
        enableHighAccuracy: true,
        timeout: Infinity,
      })
        .then((coordinates) => {
          this.setCoordBasePoint(coordinates);
        })
        .catch((error) => alert(error));
    }

    if (localStorage.zoom) {
      this.zoom = parseInt(localStorage.zoom);
    }
    if (localStorage.markers) {
      // Copy markers[] from ctorage
      this.markers = JSON.parse(localStorage.markers);
      this.regtracker = parseInt(localStorage.regtracker);
    }
  },

  async mounted() {
    await this.$refs.mapRef.$mapPromise
      .then((map) => {
        this.map = map;
      })
      .catch((error) => alert(error));
  },

  computed: {
    google: gmapApi,
    ...mapGetters({
      messageIoT: "store/messageIoT",
      GsendCmdC: "store/GsendCmdC",
    }),
  },

  watch: {
    markers: {
      handler: function (val, oldVal) {
        //   console.log("markers", this.markers.position);
      },
      deep: true,
    },

    // Handling the data receiving event
    messageIoT: function (val) {
      if (typeof val.DevEui !== "undefined") {
        this.processMes(val);
        this.connectedDevice = true;
      }
    },
    // Animate icon - send command to device
    GsendCmdC: function (val) {
      console.log(`cmd state:${val.cmd}`);
      if (val.cmd !== "") {
        this.sendcmd = true;
        val.cmd = "";
        setTimeout(() => {
          this.sendcmd = false;
        }, "3000");
      }
    },

    selected: function (val) {
      this.setBasepoint = val;
      this.GetPositionClick();
      console.log(this.setBasepoint);
    },
  },

  methods: {
    // установка позиции центра мониторинга  карте
    setCoordBasePoint(coordinates) {
      this.center = coordinates;
      this.basePoint = coordinates;
      localStorage.center = JSON.stringify(coordinates);
      localStorage.basePoint = JSON.stringify(this.basePoint);
      this.BaseDrawMarkers(this.basePoint, "Base");
    },
    // установка позиции центра мониторинга  карте в ручную
    GetPositionClick() {
      const myLatlng = null;
      let infoWindow = new google.maps.InfoWindow();

      if (this.setBasepoint) {
        this.listenerHandle = this.map.addListener(
          "click",
          (mapsMouseEvent) => {
            infoWindow.close();
            // Create a new InfoWindow.
            infoWindow = new google.maps.InfoWindow({
              position: mapsMouseEvent.latLng,
            });
            infoWindow.setHeaderContent("Центр мониторинга");
            infoWindow.setContent(
              JSON.stringify(mapsMouseEvent.latLng.toJSON(), null, 2)
            );
            infoWindow.open(this.map);
            this.setCoordBasePoint(mapsMouseEvent.latLng);
          }
        );
      } else if (this.listenerHandle !== null) {
        this.listenerHandle.remove();
      }
    },

    // Updating positions of markers data recived from field device
    updateFinishPos(res, index, new_pos, markers) {
      markers[index].position = new_pos;
      localStorage.markers = JSON.stringify(markers);
    },

    // Handling Drag  Events for the Gmap Component
    hadleDrag() {
      let center = {
        lat: this.map.getCenter().lat(),
        lng: this.map.getCenter().lng(),
      };
      let zoom = this.map.getZoom();
      localStorage.center = JSON.stringify(center);
      localStorage.zoom = zoom;
    },

    // Calling a method from an onClick event on a marker
    cmdSend(index) {
      let ctxs = {
        idtracker: this.markers[index].id_tr,
        cmd: this.markers[index].cmd,
      };
      console.log("param:", ctxs.DevEui);
      this.senCmdToTracker(ctxs);
    },

    // Create Base Statation marker on map
    BaseDrawMarkers(position) {
      this.markers[0] = {
        position: position,
        title: "Центр контроля безопасности",
        icon: require("../assets/monitor.png"),
        animation: google.maps.Animation.DROP,
        id_tr: "Control-Center",
        type: "Base",
      };
      this.markers.push;
      localStorage.markers = JSON.stringify(this.markers);
    },

    // Uplink  event recive data form centrefuge
    eventUpAddMarker(position) {
      var nf = null;
      let res = null,
        ref = this,
        new_pos = {},
        cur_pos = {},
        marker = {},
        idx,
        index;

      console.log(`UP eventUpAddMarker DevEui :${position.DevEui}`);
      //Check exist id tracker
      res = this.markers.filter(function (obj) {
        return obj.id_tr === position.DevEui;
      });

      // Found exist tracker id in this.markers[]
      if (res.length !== 0) {
        // Save new lat lng position for move from old pos to new pos
        console.log(
          `tracker ID:${position.DevEui} update coordinates : ${position.Pos[0].Ns} :${position.Pos[0].Ew} `
        );
        new_pos = {
          lat: parseFloat(position.Pos[0].Ns),
          lng: parseFloat(position.Pos[0].Ew),
        };
        cur_pos = {
          lat: res[0].position.lat,
          lng: res[0].position.lng,
        };

        // Get array tracker index exist id tracker for update pos
        index = this.markers.findIndex((x) => x.id_tr === position.DevEui);
        console.log(" get index ->", index);
        console.log("RES", res);

        let dist = ref.get_distance(cur_pos, new_pos);
        console.log(`dist in m:${Math.round(dist)}`);

        // I smoothly move the marker to a new position
        ref.animateMarker(
          new_pos,
          index,
          3000,
          this.markers,
          ref.updateFinishPos
        );
      } else {
        console.log(`not found idx ${idx} DevEui: ${position.DevEui}`);
        this.regtracker = this.regtracker + 1;
        localStorage.regtracker = this.regtracker;
        console.log(
          `Added new tracker ID to array ${position.DevEui}, reg tracker:${ref.regtracker}`
        );
        marker = {
          position: {
            lat: parseFloat(position.Pos[0].Ns),
            lng: parseFloat(position.Pos[0].Ew),
          },
          icon: require("../assets/20_20_worker-marker.png"),
          id_tr: position.DevEui,
          title: "Сотрудник",
          type: "tracker",
        };
        this.markers.push(marker);

        //save new marker in local storage
        localStorage.markers = JSON.stringify(this.markers);
        console.log(" this.markers:", this.markers);
        marker = {};
      }
    },
    // Check if you can send a command to the device by clicking on the marker.
    senCmdToTracker(ctx) {
      if (this.connectedDevice && ctx.idtracker != "Control-Center") {
        this.$store.dispatch("store/cmdSend", ctx);
        console.log(`senCmdToTracker tracker:${ctx.idtracker} cmd:${ctx.cmd}`);
      } else {
        alert(`Вполнить команду для данного типа устройства не возможно !`);
        console.log(
          `Устройства не подключены или команла на данный тип устройства невозможна`
        );
      }
    },

    processMes(mes) {
      console.log(
        `tracker id:${mes.DevEui} Cmd:${mes.Pos[0].Cmd} NS:${mes.Pos[0].Ns} WS:${mes.Pos[0].Ew}`
      );
      this.eventUpAddMarker(mes);
    },

    // Интерполяция для плавного движения маркера
    animateMarker(toPosition, idx, duration, markers, updatePos) {
      const fromPosition = this.markers[idx].position;
      //  console.log("fromPosition-->>", fromPosition);
      const start = performance.now();

      function step(timestamp) {
        const progress = Math.min((timestamp - start) / duration, 1);
        const lat =
          fromPosition.lat + (toPosition.lat - fromPosition.lat) * progress;
        const lng =
          fromPosition.lng + (toPosition.lng - fromPosition.lng) * progress;
        const newPosition = { lat, lng };

        markers[idx].position = newPosition;
        updatePos(0, idx, newPosition, markers);
        //  console.log("------->", markers[idx].position);

        if (progress < 1) {
          requestAnimationFrame(step); // Продолжаем анимацию
        }
      }

      requestAnimationFrame(step);
    },
    //Measuring distance based on coordinate data received from the device
    get_distance(mk1, mk2) {
      var R = 3958.8; // Radius of the Earth in miles
      var rlat1 = mk1.lat * (Math.PI / 180); // Convert degrees to radians
      var rlat2 = mk2.lat * (Math.PI / 180); // Convert degrees to radians
      var difflat = rlat2 - rlat1; // Radian difference (latitudes)
      var difflon = (mk2.lng - mk1.lng) * (Math.PI / 180); // Radian difference (longitudes)

      var d =
        2 *
        R *
        Math.asin(
          Math.sqrt(
            Math.sin(difflat / 2) * Math.sin(difflat / 2) +
              Math.cos(rlat1) *
                Math.cos(rlat2) *
                Math.sin(difflon / 2) *
                Math.sin(difflon / 2)
          )
        );
      // Convert miles into m
      return (d = d / 0.6213711922) * 1000;
    },
  },
};
</script>

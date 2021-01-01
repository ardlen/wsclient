<template>
  <q-page class="q-pa-md">
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
    <GmapMap
      :center="center"
      :zoom="zoom"
      style="width: 100%; height: 650px;"
      ref="mapRef"
      @dragend="hadleDrag"
    >
      <gmap-custom-marker
        v-for="(marker, i) in markers"
        :key="marker._id"
        :marker="marker.type !== 'Base' ? mov_marker : marker.position"
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
// AIzaSyD74xUehO3WNownQ3jONr-Bxke642KhP_E
// src="https://maps.googleapis.com/maps/api/js?key=AIzaSyD74xUehO3WNownQ3jONr-Bxke642KhP_E&libraries=geometry"
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
    key: "AIzaSyD74xUehO3WNownQ3jONr-Bxke642KhP_E"
  }
});

export default {
  name: "Map",
  components: {
    "gmap-custom-marker": GmapCustomMarker
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
        cmd: null,
        type: null
      },
      connectedDevice: false,
      sendcmd: false,
      testPositionMarker: { lat: 55.89727916894833, lng: 37.41036535913652 },
      mr: []
    };
  },

  created() {
    if (localStorage.center) {
      this.center = JSON.parse(localStorage.center);
    } else {
      this.$getLocation({})
        .then(coordinates => {
          this.basePoint = coordinates;
          this.center = coordinates;
          localStorage.center = JSON.stringify(coordinates);
          localStorage.basePoint = JSON.stringify(this.basePoint);
          this.drawMarkers(this.basePoint, "Base");
        })
        .catch(error => alert(error));
    }

    if (localStorage.zoom) {
      this.zoom = parseInt(localStorage.zoom);
    }
    if (localStorage.markers) {
      this.markers = JSON.parse(localStorage.markers);
      this.regtracker = parseInt(localStorage.regtracker);
      if (this.regtracker > 0) {
        let mov_mr = JSON.parse(localStorage.markers);
        this.mov_marker = mov_mr[1].position;
      }
    }
  },

  mounted() {
    this.$refs.mapRef.$mapPromise
      .then(map => (this.map = map))
      .catch(error => alert(error));
  },

  computed: {
    google: gmapApi,

    ...mapGetters({
      messageIoT: "store/messageIoT"
    }),
    ...mapGetters({
      GsendCmdC: "store/GsendCmdC"
    })
  },

  watch: {
    mov_marker: {
      handler: function(val, oldVal) {},
      deep: true
    },

    messageIoT: function(val) {
      if (typeof val.DevEui !== "undefined") {
        this.processMes(val);
        this.connectedDevice = true;
      }
    },

    GsendCmdC: function(val) {
      console.log(`cmd state:${val.cmd}`);
      if (val.cmd !== " ") {
        this.sendcmd = true;
        this.await(800).then(() => {
          this.sendcmd = false;
        });
      }
    }
  },

  methods: {
    test(v) {
      return console.log(v);
    },

    // move marker from position current to moveto in t seconds
    animatedMove: function(new_pos, res, index, markers, mov_marker) {
      var numDeltas = 200;
      var delay = 90; //milliseconds
      var i = 0;
      var deltaLat;
      var deltaLng;
      let movemarker;
      let distance, i_marker;

      let latlng = { lat: 0, lng: 0 };
      var refG = this;
      var position = { lat: res[0].position.lat, lng: res[0].position.lng };

      let dist = getDistance(position, new_pos);
      console.log("distance", dist);

      transition(new_pos);
      console.log("animatedMove : ", new_pos, res, index, mov_marker);

      function transition(new_pos) {
        i = 0;
        deltaLat = (new_pos.lat - position.lat) / numDeltas;
        deltaLng = (new_pos.lng - position.lng) / numDeltas;
        moveMarker();
      }

      function moveMarker() {
        position.lat += deltaLat;
        position.lng += deltaLng;
        latlng = { lat: position.lat, lng: position.lng };
        refG.mov_marker = latlng;
        if (i != numDeltas) {
          i++;
          setTimeout(moveMarker, delay);
        }
        updateFinishPos(res, index, new_pos, markers);
      }

      function updateFinishPos(res, index, new_pos, markers) {
        i_marker = {
          position: new_pos,
          cmd: res[0].cmd,
          title: "Сотрудник",
          id_tr: res[0].id_tr,
          type: "tracker",
          icon: require("../assets/20_20_worker-marker.png")
        };
        //   console.log("updateFinishPos : ", res, index, new_pos, markers);
        markers[index] = i_marker;
        //   console.log(" markers :", markers[index]);
        localStorage.markers = JSON.stringify(markers);
      }

      function getDistance(p1, p2) {
        var rad = function(x) {
          return (x * Math.PI) / 180;
        };

        var R = 6378137; // Earth’s mean radius in meter
        var dLat = rad(p2.lat - p1.lat);
        var dLong = rad(p2.lng - p1.lng);
        var a =
          Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.cos(rad(p1.lat)) *
            Math.cos(rad(p2.lat)) *
            Math.sin(dLong / 2) *
            Math.sin(dLong / 2);
        var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        var d = R * c;
        return d; // returns the distance in meter
      }
    },

    hadleDrag() {
      let center = {
        lat: this.map.getCenter().lat(),
        lng: this.map.getCenter().lng()
      };
      let zoom = this.map.getZoom();
      localStorage.center = JSON.stringify(center);
      localStorage.zoom = zoom;
    },

    cmdSend: function(index) {
      let ctxs = {
        idtracker: this.markers[index].id_tr,
        cmd: this.markers[index].cmd
      };
      console.log("param:", ctxs);
      this.senCmdToTracker(ctxs);
    },

    drawMarkers(position, type_tr) {
      let type_trecker, title_marker, iconImg;
      // create base marker initial state
      if (type_tr === "Base") {
        this.markers[0] = {
          position: position,
          title: "Центр контроля безопасности",
          icon: require("../assets/monitor.png"),
          id_tr: "Control-Center",
          cmd: 67,
          type: type_tr
        };
        //render markers Base initial state
        // this.await(600).then(() => {
        //   this.$gmapApiPromiseLazy().then(() => {
        //     let marker = new google.maps.Marker({
        //       map: this.map,
        //       position: position,
        //       icon: this.markers[0].icon,
        //       title: this.markers[0].title,
        //       cmd: this.markers[0].cmd
        //     });
        //   });
        // });
      } else {
        // render all markers on map from local storage
        // for (let i = 0; i <= this.regtracker; i++) {
        //   console.log("position->>", this.markers[i]);
        //   this.await(400).then(() => {
        //     this.$gmapApiPromiseLazy().then(() => {
        //       let y = new google.maps.Marker({
        //         map: this.map,
        //         position: this.markers[i].position,
        //         icon: this.markers[i].icon,
        //         title: this.markers[i].title
        //       });
        //       let ctx = this.markers[i];
        //       var ref = this;
        //       google.maps.event.addListener(y, "click", function(y) {
        //         ref.cmdSend(ctx);
        //       });
        //     });
        //   });
        // }
      }
      //save  markers[] in local storage for restore position

      localStorage.markers = JSON.stringify(this.markers);
    },

    eventUpAddMarker(position) {
      var nf = null;
      let res = null,
        ref = this,
        new_pos = {},
        marker = {},
        idx,
        index,
        el;

      console.log(`input par DevEui :${position.DevEui}`);
      //check exist id tracker
      res = this.markers.filter(function(obj) {
        console.log("filtered by id tracker :", res);
        return obj.id_tr === position.DevEui;
      });

      if (res.length !== 0) {
        console.log(`tracker ID:${position.DevEui} exist indx : ${idx} `);
        new_pos = {
          lat: parseFloat(position.Pos[0].Ns),
          lng: parseFloat(position.Pos[0].Ew)
        };
        // get array tracker index exist id tracker
        index = this.markers.findIndex(x => x.id_tr === position.DevEui);
        console.log(" get index ->", index);
        ref.animatedMove(new_pos, res, index, this.markers, this.mov_marker);
      }
      if (res.length === 0) {
        console.log(`not found idx ${idx} DevEui: ${position.DevEui}`);
        this.regtracker = +1;
        localStorage.regtracker = this.regtracker;
        console.log(
          `added new tracker ID to array ${position.DevEui}, reg tracker:${ref.regtracker}`
        );
        marker = {
          position: {
            lat: parseFloat(position.Pos[0].Ns),
            lng: parseFloat(position.Pos[0].Ew)
          },
          cmd: 67,
          icon: require("../assets/20_20_worker-marker.png"),
          id_tr: position.DevEui,
          title: "Сотрудник",
          type: "tracker"
        };
        this.markers.push(marker);
        this.mov_marker = marker.position;
        //save new marker in local storage

        localStorage.markers = JSON.stringify(this.markers);
        console.log(" this.markers:", this.markers);
        marker = {};
      }

      // if (!nf) {
      //   nf = f;
      //   this.regtracker = +1;
      //   localStorage.regtracker = this.regtracker;
      //   console.log(
      //     `added new tracker ID to array ${position.DevEui}, reg tracker:${this.regtracker}`
      //   );
      //   this.markers[this.regtracker] = {
      //     position: {
      //       lat: parseFloat(position.Pos[0].Ns),
      //       lng: parseFloat(position.Pos[0].Ew)
      //     },
      //     title: "Сотрудник",
      //     icon: require("../assets/20_20_worker-marker.png"),
      //     id_tr: position.DevEui,
      //     cmd: 67,
      //     type: "tracker"
      //   };
      //   //save new markers[] in local storage
      //   localStorage.markers = JSON.stringify(this.markers);
      //   console.log(" this.markers:", this.markers[this.regtracker]);
      // }
    },

    senCmdToTracker(ctx) {
      if (this.connectedDevice) {
        console.log(`senCmdToTracker tracker:${ctx.idtracker} cmd:${ctx.cmd}`);
        this.$store.dispatch("store/cmdSend", ctx);
      } else {
        console.log(`Устройства не подключены`);
      }
    },

    processMes(mes) {
      console.log(
        `tracker id:${mes.DevEui} Cmd:${mes.Pos[0].Cmd} NS:${mes.Pos[0].Ns} WS:${mes.Pos[0].Ew}`
      );
      this.eventUpAddMarker(mes);
    }
  }
};
</script>

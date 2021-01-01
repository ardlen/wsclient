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
        :marker="marker.position"
        :draggable="false"
        @click.native="cmdMarker(i)"
      >
        <!--     <template v-if="marker.type === 'Base'">
          <img class="icon" src="~/assets/monitor.png" height="33" />
        </template>
        <template v-else>
          <img
            class="icon"
            src="~/assets/20_20_worker-marker.png"
            height="30"
          />
        </template> -->
      </gmap-custom-marker>
    </GmapMap>
  </q-page>
</template>
<script>
// AIzaSyD74xUehO3WNownQ3jONr-Bxke642KhP_E
/*eslint-disable */

import { mapState, mapActions, mapGetters } from "vuex";
import Vue from "vue";
import * as VueGoogleMaps from "gmap-vue";
import GmapCustomMarker from "vue2-gmap-custom-marker";
//import VueGoogleMaps from "vue2-google-maps";
import VueGeoloctaion from "vue-browser-geolocation";

Vue.use(VueGeoloctaion);
Vue.use(VueGoogleMaps, {
  load: {
    key: "AIzaSyD74xUehO3WNownQ3jONr-Bxke642KhP_E"
  },
  installComponents: true
});

export default {
  name: "Map",
  components: {
    "gmap-custom-marker": GmapCustomMarker
  },
  data() {
    return {
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
          this.addMarker(this.basePoint, "Base");
        })
        .catch(error => alert(error));
    }

    if (localStorage.zoom) {
      this.zoom = parseInt(localStorage.zoom);
    }
    if (localStorage.markers) {
      this.markers = JSON.parse(localStorage.markers);
    }
  },

  mounted() {
    this.$refs.mapRef.$mapPromise.then(map => (this.map = map));
    this.$gmapApiPromiseLazy().then(() => {
      var bounds = new google.maps.LatLngBounds();
    });
  },

  computed: {
    google: function() {
      if (typeof google !== "undefined") {
        this.await(1000).then(() => {
          console.log("VueGoogleMaps-->", VueGoogleMaps);
          return VueGoogleMaps;
        });
      }
    },
    test: function(val) {
      return console.log("---->", val);
    },

    ...mapGetters({
      messageIoT: "store/messageIoT"
    }),
    ...mapGetters({
      GsendCmdC: "store/GsendCmdC"
    })
  },

  watch: {
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
    await(ms) {
      return new Promise(resolve => setTimeout(resolve, ms));
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

    addMarker(position, type_tr) {
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

        //render markers on map
        let m = new google.maps.Marker({
          map: this.map,
          position: this.markers[0].position,
          icon: this.markers[0].icon,
          title: this.markers[0].title
        });
      } else {
        //create online marker from event - recive IoT messages and check exist DevUi b96d8bf1b4fd740a
        let res,
          trackers = null;
        this.markers.find(function(res, index) {
          if (res.id_tr === position.DevEui) {
            res = true;
            console.log("res", res);
          } else {
            trackers = trackers + 1;
            console.log("trakers-->", trackers);
          }
        });
        if (!res) {
          this.regtracker = trackers;
          console.log(this.regtracker);
          for (let i = 1; i <= this.regtracker; i++) {
            this.markers[i] = {
              position: { lat: position.Pos[0].Ns, lng: position.Pos[0].Ew },
              icon: require("../assets/20_20_worker-marker.png"),
              id_tr: position.DevEui,
              cmd: 67,
              type: type_tr,
              title: "Сотрудник"
            };
          }
        }
      }

      //save  markers[] in local storage for restore position
      localStorage.markers = JSON.stringify(this.markers);
    },

    cmdMarker(i) {
      var lat = this.testPositionMarker.lat;
      var lng = this.testPositionMarker.lng;
      var latlng = new google.maps.LatLng(lat, lng);
      const iconImg = require("../assets/20_20_worker-marker.png");

      console.log("map -->", google, latlng);
      this.m = new google.maps.Marker({
        map: this.map,
        position: this.basePoint,
        icon: iconImg,
        title: "Welcome !!"
      });

      this.testPositionMarker.lat = this.testPositionMarker.lat + 0.0122;
      this.testPositionMarker.lng = this.testPositionMarker.lng + 0.0101;
      // console.log(this.markers[1]);

      // this.markers[1].setPosition({
      //   lat: this.testPositionMarker.lat,
      //   lng: this.testPositionMarker.lng
      // });

      this.testPositionMarker.lat = this.testPositionMarker.lat + 0.0022;
      this.testPositionMarker.lng = this.testPositionMarker.lng + 0.0001;
      this.m.setPosition({
        lat: this.testPositionMarker.lat,
        lng: this.testPositionMarker.lng
      });

      console.log("new marker", this.m.position);
      let ctx = {
        idtracker: this.markers[i].id_tr,
        cmd: this.markers[i].cmd
      };
      this.senCmdToTracker(ctx);
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
      //  this.regtracker += 1;
      this.addMarker(mes, "tracker");
    }
  },

  // animatedMove(marker, .5, marker.position, e.latLng);
  // move marker from position current to moveto in t seconds

  animatedMove(marker, t, current, moveto) {
    var lat = current.lat;
    var lng = current.lng;

    var deltalat = (moveto.lat - current.lat) / 100;
    var deltalng = (moveto.lng - current.lng) / 100;

    var delay = 10 * t;
    for (var i = 0; i < 100; i++) {
      (function(ind) {
        setTimeout(function() {
          var lat = marker.lat;
          var lng = marker.lng;
          lat += deltalat;
          lng += deltalng;
          latlng = new google.maps.LatLng(lat, lng);
          console.log(latlng);
          marker.setPosition(latlng);
        }, delay * ind);
      })(i);
    }
  }
};
</script>

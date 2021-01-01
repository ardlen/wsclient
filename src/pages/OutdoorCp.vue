<template>
  <q-page class="q-pa-md">
    <div>
    </div>
    <div id="map">
      <gmap-map
        :center="center"
        :zoom="zoom"
        style="width: 100%; height: 450px;">
        <gmap-marker v-for="(marker) in markers"
          :key="marker.key"
          :position="marker">
        </gmap-marker>
      </gmap-map>
  </div>
  </q-page>
</template>
<script>
// AIzaSyD74xUehO3WNownQ3jONr-Bxke642KhP_E
/*eslint-disable */
import Vue from 'vue'
import * as VueGoogleMaps from 'vue2-google-maps'

Vue.use(VueGoogleMaps, {
  load: {
    key: 'AIzaSyD74xUehO3WNownQ3jONr-Bxke642KhP_E'
  }
})

export default {
  name: 'Outdoor',
 
  data () {
    return {
      center: {
        lat: 0,
        lng: 0,
      },

      coordinates:{
        lat: 0,
        lng: 0
      },
      zoom: 7,
      markers: [],
      places: {lat:55.90280166855803, lng:37.396560436627276},
      currentPlace: null,
      options: {
        zoomControl: true, 
        mapTypeControl: true, 
        scaleControl: false, 
        streetViewControl: false, 
        fullscreenControl: true 
      },
      

      //icon: '@/assets/worker-marker.jpg'
    }
  },

    
  mounted() {
    this.geolocate();
        
  },
  methods: {
    moveMarker: function() {
      // position[0] += deltaLat;
      // position[1] += deltaLng;
      // var latlng = new google.maps.LatLng(position[0], position[1]);
      // marker.setTitle("Latitude:"+position[0]+" | Longitude:"+position[1]);
      // marker.setPosition(latlng);
      // if(i!=numDeltas){
      //     i++;
      //     setTimeout(moveMarker, delay);
      //    }
       },

    
      
    transition: function (result) {
      // i = 0;
      //  deltaLat = (result[0] - position[0])/numDeltas;
      //  deltaLng = (result[1] - position[1])/numDeltas;
      //  moveMarker();
      //  }
    },
  
   geolocate: function() {
      // navigator.geolocation.getCurrentPosition(position => {
      //   this.center = {
      //     lat: position.coords.latitude,
      //     lng: position.coords.longitude } }   
      //     )
      // }
   }     
   
  }

}

</script>




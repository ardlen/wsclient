<template>
  <map-locator />
</template>
<script>
/*eslint-disable */
import { mapState, mapActions } from "vuex";
import mapLocator, { locator } from "./map-locator.vue";
import Centrifuge from "centrifuge";

export default {
  components: { mapLocator },
  name: "Indoor",

  computed: {
    ...mapState("store", ["userDetailes", "subscription"]),
  },
  methods: {
    ...mapActions("store", ["connectWs", "registerUser"]),
  },

  mounted() {
    this.connectWs();
  },
  created() {},
};
</script>

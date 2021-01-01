<template>
  <q-page class="flex flex-center">
    <h1>Indoor</h1>
  </q-page>
</template>
<script>
/*eslint-disable */
import { mapState, mapActions } from "vuex";
import Centrifuge from "centrifuge";

export default {
  name: "Indoor",

  computed: {
    ...mapState("store", ["userDetailes", "subscription"])
  },
  methods: {
    ...mapActions("store", ["connectWs", "registerUser"])
  },

  mounted() {
    this.connectWs();
  },
  created() {}
};
</script>

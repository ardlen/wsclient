<template>
  <q-layout view="lHh Lpr lFf">
    <q-header elevated>
      <q-toolbar>
        <q-btn
          flat
          dense
          round
          icon="menu"
          aria-label="Menu"
          @click="leftDrawerOpen = !leftDrawerOpen"
        />
        <q-toolbar-title> Worker safety </q-toolbar-title>
        <div>iot Safety v{{ version }}</div>
      </q-toolbar>
    </q-header>

    <q-drawer
      v-model="leftDrawerOpen"
      show-if-above
      bordered
      content-class="bg-grey-1"
    >
      <q-list>
        <q-item-label header> IoT Сценарии </q-item-label>
        <q-item to="/indoor" exact>
          <q-item-section avatar>
            <q-avatar rounded>
              <img src="~src/assets/indoor-nav.png" />
            </q-avatar>
          </q-item-section>
          <q-item-section
            >Контроль внутри помещений
            <q-item-label caption
              >Персональная безопасность внутри помещений</q-item-label
            >
          </q-item-section>
        </q-item>
        <q-separator spaced inset="item" />
        <q-item to="/outdoor" exact>
          <q-item-section avatar>
            <q-avatar rounded>
              <img src="~src/assets/outdoor-nav.png" />
            </q-avatar>
          </q-item-section>
          <q-item-section
            >Контроль на открытых зонах
            <q-item-label caption
              >Персональная безопасность на открытых объектах</q-item-label
            >
          </q-item-section>
        </q-item>
        <q-separator spaced inset="item" />
        <q-item to="/workers" exact>
          <q-item-section avatar>
            <q-avatar rounded>
              <img src="~src/assets/workers.png" />
            </q-avatar>
          </q-item-section>
          <q-item-section
            >Сотрудники
            <q-item-label caption>Справочник сотрудников</q-item-label>
          </q-item-section>
        </q-item>
        <q-separator spaced inset="item" />
        <q-item to="/devices" exact>
          <q-item-section avatar>
            <q-avatar rounded>
              <img src="~src/assets/monitor_heart_26dp.png" />
            </q-avatar>
          </q-item-section>
          <q-item-section
            >Управление устройствами
            <q-item-label caption>Консоль подключенных устройcтв</q-item-label>
          </q-item-section>
        </q-item>
        <q-separator spaced inset="item" />
        <q-item to="/monitor" exact>
          <q-item-section avatar>
            <q-avatar rounded>
              <img src="~src/assets/add_alert_26dp.png" />
            </q-avatar>
          </q-item-section>
          <q-item-section
            >Общий мониторинг угроз
            <q-item-label caption
              >Предупреждения, тревоги и анализ инцидентов</q-item-label
            >
          </q-item-section>
        </q-item>
        <q-separator spaced inset="item" />
        <q-item to="/cmd" exact>
          <q-item-section avatar>
            <q-avatar rounded>
              <img src="~src/assets/settings_26dp.png" />
            </q-avatar>
          </q-item-section>
          <q-item-section
            >Общие настройки
            <q-item-label caption>Консоль настроек</q-item-label>
          </q-item-section>
        </q-item>
      </q-list>
    </q-drawer>

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script>
/*eslint-disable */
import { mapState, mapActions } from "vuex";
export default {
  name: "MainLayout",
  data() {
    return {
      leftDrawerOpen: false,
      version: "1.23",
    };
  },
  methods: {
    ...mapActions("store", ["connectWs", "registerUser", "closeConnect"]),
  },

  mounted() {
    this.connectWs();
  },
  destroyed() {
    this.closeConnect();
  },
};
</script>

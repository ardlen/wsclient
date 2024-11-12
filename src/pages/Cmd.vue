<template>
  <q-page class="q-pa-md">
    <q-card style="width: 640px">
      <q-card-section>
        <div class="text-h6">Настройки</div>
      </q-card-section>
      <q-separator />
      <q-card-section>
        <div style="font-size: 12px; padding: 2px">Локальный кэш данных</div>
        <q-form>
          <!-- Toogle to clear markers data  -->
          <q-toggle
            v-model="clear_markers"
            label="Очистить хранилище : данные маркеров на карте"
          />
          <!-- Toggle to clear device list data  -->
          <q-toggle
            v-model="clear_devices"
            label="Очистить хранилище : данные списка устройств"
          />
          <!-- Toggle to clear monitoring center coordinates  -->
          <q-toggle
            v-model="clear_basePoint"
            label="Очистить хранилище : гео данные центра контроля"
          />
          <div class="interval_cont">
            <div class="counter">
              <div
                style="
                  font-size: 11px;
                  font-weight: 150;
                  padding: 1px;
                  height: 40px;
                  align-content: center;
                "
              >
                Интервал проверки данных
              </div>

              <div class="q-pt-none">
                <q-input
                  v-model.number="wait_in_sec"
                  type="number"
                  hint="В секундах"
                  input-class="text-center"
                  style="max-width: 80px"
                />
              </div>
            </div>
            <div class="counter">
              <div
                style="
                  font-size: 11px;
                  font-weight: 150;
                  padding: 2px;
                  height: 40px;
                  align-content: center;
                "
              >
                Время ожидания пакета
              </div>
              <div class="q-pt-none">
                <q-input
                  v-model.number="dept_in_sec"
                  type="number"
                  hint="В секундах"
                  input-class="text-center"
                  style="max-width: 80px"
                />
              </div>
            </div>
            <div class="counter">
              <div
                style="
                  font-size: 11px;
                  font-weight: 150;
                  padding: 2px;
                  height: 40px;
                  align-content: center;
                "
              >
                Контроль актив. устройства
              </div>
              <div class="q-pt-none">
                <q-input
                  v-model.number="dept_in_sec_act"
                  type="number"
                  hint="В секундах"
                  input-class="text-center"
                  style="max-width: 80px"
                />
              </div>
            </div>
          </div>
          <div class="q-pa-md q-gutter-sm">
            <q-btn label="Применить" @click="applySettings" color="primary" />
          </div>
        </q-form>
      </q-card-section>
      <q-separator />
      <q-card-section>
        <div style="font-size: 12px">Позиционирование</div>
      </q-card-section>
      <q-input
        v-if="files_name !== null"
        v-model="files_name"
        label="Используемый файл для плана помещения"
        disable
        style="max-width: 300px; margin-left: 20px; margin-bottom: 10"
      >
      </q-input>
      <template>
        <div class="q-pa-md example-row-stacked-to-horizontal">
          <div class="row">
            <div class="col-6">
              <q-file
                v-if="files_name !== null"
                v-model="files"
                label="Загрузить файл с планом помещения"
                filled
                counter
                :counter-label="counterLabelFn"
                style="max-width: 300px"
              >
                <template v-slot:prepend>
                  <q-icon name="attach_file" />
                </template>
              </q-file>
            </div>
            <div class="col-6">
              <q-input
                filled
                v-model="set_bind_image"
                label="Привязка плана к лок.коор."
                hint="Привязка к изображения к массштабу локальных координт"
                @change="set_bind"
                error-message="Значение не соответствует шабону"
                :error="!isValid"
                style="max-width: 300px"
              />
            </div>
          </div>
        </div>
      </template>
      <div></div>
    </q-card>
  </q-page>
</template>

<script>
/*eslint-disable */
import { ref } from "vue";
import { Notify } from "quasar";
export default {
  data() {
    return {
      error_message: false,
      files: ref(null),
      files_name: null,
      set_bind_image: null,
      clear_markers: false,
      clear_devices: false,
      clear_basePoint: false,
      wait_in_sec: 0, // Device list data verification period
      dept_in_sec: 0, // To control the latest received data, it is necessary to use delta in sec.
      dept_in_sec_act: 0, // To control the period of detection of inactive devices
      isValid: true,
    };
  },
  created() {
    if (localStorage.wait_in_sec) {
      this.wait_in_sec = localStorage.wait_in_sec;
    }
    if (localStorage.dept_in_sec) {
      this.dept_in_sec = localStorage.dept_in_sec;
    }
    if (localStorage.dept_in_sec_act) {
      this.dept_in_sec_act = localStorage.dept_in_sec_act;
    }
    if (localStorage.ImagePlan) {
      this.files_name = localStorage.ImagePlan;
    }
    if (localStorage.set_bind_image) {
      this.set_bind_image = localStorage.set_bind_image;
    }
  },

  methods: {
    get_name(val) {
      console.log("Event ", val);
    },
    counterLabelFn({ totalSize, filesNumber, maxFiles }) {
      console.log(typeof this.files);
      if (this.files !== null) {
        this.files_name = this.files.name;
        localStorage.ImagePlan = JSON.stringify(this.files_name);
        Notify.create({ message: "Установки сохранены ", type: "positive" });
      }

      return `${filesNumber} files of ${maxFiles} | ${totalSize}`;
    },
    isValidStructure(data) {
      // Задаем эталонную структуру для проверки
      const template = { bounds: [0, 0, 0, 0] };

      // Проверяем, что `data` является объектом
      if (typeof data !== "object" || data === null) {
        console.log("Object error");
        return false;
      }

      // Проверяем наличие и типы ключей в объекте `data`
      for (let key in template) {
        if (!(key in data) || typeof data[key] !== typeof template[key]) {
          console.log("Template error");
          return false;
        }
      }

      // Если все ключи соответствуют структуре, возвращаем true
      return true;
    },

    set_bind(props) {
      let data;
      try {
        data = JSON.parse(props.target._value);
      } catch {
        this.isValid = false;
      }
      console.log(typeof data);
      if (this.isValidStructure(data)) {
        localStorage.set_bind_image = JSON.stringify(data);
        this.isValid = true;
        Notify.create({ message: "Установки сохранены ", type: "positive" });
      } else {
        this.isValid = false;
        console.log("error");
      }

      console.log(props.target._value);
    },

    // Method of applying settings
    applySettings() {
      if (this.clear_markers) {
        localStorage.removeItem("markers");
        console.log("Markers list cleared !");
      }
      if (this.clear_devices) {
        localStorage.removeItem("data_dev_list");
        console.log("Device list cleared !");
      }
      if (this.clear_basePoint) {
        localStorage.removeItem("center");
        console.log("Data Monitoring Center coordinates cleared !");
      }

      if (this.wait_in_sec !== 0) {
        localStorage.wait_in_sec = this.wait_in_sec;
      }
      if (this.dept_in_sec !== 0) {
        localStorage.dept_in_sec = this.dept_in_sec;
      }
      if (this.dept_in_sec_act !== 0) {
        localStorage.dept_in_sec_act = this.dept_in_sec_act;
      }
    },
  },
};
</script>

<style scoped>
/* Ваши стили */
.interval_cont {
  padding: 20px;
  text-align: center;
  display: flex;
  gap: 20px;
  font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
    Oxygen, Ubuntu, Cantarell, "Open Sans", "Helvetica Neue", sans-serif;
}
.counter {
  display: column;
  width: 80px;
  height: 150;
  background: rgba(128, 128, 128, 0.081);
  padding: 7px;
  border-radius: 5px;
  box-shadow: rgba(99, 99, 99, 0.2) 0px 2px 8px 0px;
}
</style>

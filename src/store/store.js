// console.log(`Payload data DevEUI:${state.messageIoT.DevEui}, ${state.messageIoT.da}),`);
// console.log(`Payload data DevEUI:${payload.data.DevEui}),
// Ew: ${payload.data.Pos[0].Ew}, Ns: ${payload.data.Pos[0].Ns}
// Major:${payload.data.DataContext[0].Data[0].Major},
// Minor:${payload.data.DataContext[0].Data[0].Minor},
// TxRssi:${payload.data.DataContext[0].Data[0].TxRssi}`);

/*eslint-disable */
import Centrifuge from 'centrifuge';
import Token from 'jsonwebtoken';

/*eslint-disable */
const state = () =>({
	userDetailes: {},
	subscription: {},
	users: {},
  messageIoT:{},
  messageIoTN:{},
  filter_list:{},

})

const state_cmd = ()=>({
  cmd:{}
})

let centrifuge = {};
let initF = false;
let Res = null
var result = null;
var existDevEui = {};
var messagePos = {
    DevEui:0,
    Cmd: 0,
	Ns: 0,
	Ew: 0
};
var ctx={}

const mutations = {
  // Commit Uplink payload
	saveMessage(state, payload) {
  // Filtering data context received from share subscription, state change - device data only
    if( payload.data.DevEui !== undefined){
     state.messageIoT = payload.data}

    },

  MsendCmdC(state_cmd,payload){
        state_cmd.cmd = payload
  },

  convertStr(state, payload ) {
      let ctx = {
        DevEui: payload.data.DevEui,
        Ew: payload.data.Pos[0].Ew,
        Ns: payload.data.Pos[0].Ns,
        Cmd: payload.data.Pos[0].Cmd,
        BeaconData: {
          B1: {
            Data: {
             Major: payload.data.DataContext[0].Data[0].Major,
             Minor: payload.data.DataContext[0].Data[0].Minor,
             TxRssi: payload.data.DataContext[0].Data[0].TxRssi
            }
          }
        }
      };
      state.messageIoTN = ctx
      console.log("convert ctx->", ctx);
    }
   };

const getters = {
 GsendCmdC:(state_cmd) => {
    return state_cmd.cmd
    },

 messageIoT:(state) => {
    return state.messageIoT
  }
};
// Actions in store
const actions = {
	connectWs({ commit} , _payload) {
 		var user = 'ardlen';
		var privateKey = '6099a6cb-cce8-4e54-b7e3-9c5ef27f1b5a';
		var clToken = Token.sign({ sub: 'ardlen' }, privateKey);
// Create webscoket client Centrefuge
		centrifuge = new Centrifuge('ws://localhost:8000/connection/websocket');
		centrifuge.setToken(clToken);
// Subscribe and recive message
		centrifuge.subscribe('iotWorkSafety', function(messageIoT) {
    commit('saveMessage', messageIoT);

		});
	   	centrifuge.connect();
	   	centrifuge.on('connect', function(ctx) {
			console.log('connected client id:', ctx.client);
			return ctx.client;
		});
		centrifuge.on('disconnect', function(ctx) {
			console.log('disconnected', ctx);
		});
	},

	closeConnect() {
	centrifuge.disconnect()},

  //Publish message (command for device) in iotWorkSafety chanel
	 cmdSend({commit}, payload) {
    centrifuge.publish("iotWorkSafety", {"Idtracker":payload.idtracker, "Cmd":payload.cmd  }).then(function() {
    console.log(`Successfully published devEUI:${payload.idtracker} Cmd:${payload.cmd}`);
    commit('MsendCmdC',payload)
       return true
      }, function(err) {
          console.log(`publish error :${err}:${payload.idtracker}`);
      return false
      })
     },
};

export default {
namespaced: true,
state,
state_cmd,
actions,
mutations ,
getters,
};

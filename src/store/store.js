/*eslint-disable */

import Vue from 'vue';
import Centrifuge from 'centrifuge';
import Token from 'jsonwebtoken';


const removerAcentos = (string) => {
  const mapaAcentosHex = {
    a: /[\xE0-\xE6]/g,
    e: /[\xE8-\xEB]/g,
    i: /[\xEC-\xEF]/g,
    o: /[\xF2-\xF6]/g,
    u: /[\xF9-\xFC]/g,
    c: /\xE7/g
  }

  for (let letra in mapaAcentosHex) {
    var expressaoRegular = mapaAcentosHex[letra]
    string = string.replace(expressaoRegular, letra)
  }

  return string
}

/*eslint-disable */
const state = () =>({
	userDetailes: {},
	subscription: {},
	users: {},
  messageIoT:{},
  messageIoTN:{},
  listTrackers:[],
  filter_list:{},
  cmd:{},   
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

	saveMessage(state, payload) {
       state.messageIoT = payload.data     
       
    },
  addListTrackers(state,payload){
  },

  MsendCmdC(state,payload){
         state.cmd = payload        
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
 GsendCmdC:(state) => { 
    return state.cmd
    },
    
 messageIoT:(state) => { 
    return state.messageIoT 
  } 


};

const actions = {
	connectWs({ commit} , payload) {
 		var user = 'ardlen';
		var privateKey = '6099a6cb-cce8-4e54-b7e3-9c5ef27f1b5a';
		var clToken = Token.sign({ sub: 'ardlen' }, privateKey);
		centrifuge = new Centrifuge('ws://localhost:8000/connection/websocket');
		centrifuge.setToken(clToken);
		// Subscribe and recive message
		centrifuge.subscribe('iotWorkSafety', function(message) {
  //   console.log('subscribe', message);
      commit('saveMessage', message);   
     // commit('convertStr', message);   
    //commit('addListTrackers', messagePos);
     
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

	 cmdSend({commit}, payload) {
    console.log(`send command:${payload.cmd} to tracker:${payload.idtracker}`); 
    centrifuge.publish("iotWorkSafety", {"cmd ":payload.cmd ,"idtracker":payload.idtracker }).then(function() {
      console.log('successfully published');
      commit('MsendCmdC',payload)
       return true
      }, function(err) {
          console.log('publish error', err);
      return false        
      })    
     },   
};

export default {
namespaced: true,
state,
actions,
mutations ,
getters,	
};

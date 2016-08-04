import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';

import '../imports/startup/accounts-config.js';
import '../imports/api/db.js';

import { ITEMS_DB } from '../imports/api/db.js';
import { BINS_DB } from '../imports/api/db.js';
import { SHELVES_DB } from '../imports/api/db.js';
import { ROOMS_DB } from '../imports/api/db.js';

import { ItemsIndex } from '../imports/api/db.js';
import { BinsIndex } from '../imports/api/db.js';
import { ShelvesIndex } from '../imports/api/db.js';
import { RoomsIndex } from '../imports/api/db.js';

import './main.html';

var panZoomMap;
$(document).ready(function(){
  setTimeout(function(){
    panZoomMap = svgPanZoom('#svg-map', {
      maxZoom: 100,
      controlIconsEnabled: true
    });
    resizeEverything();
  }, 2000);
});

window.addEventListener("resize", function(e) {
  resizeEverything();
});

function resizeEverything(){
  var pb = $(".map_bottom");
  pb.css("padding-bottom", pb.width()*(6/19) + 30);

  var sh = $(".svg-ht");
  var h = sh.width()*(6/19) + 30;
  sh.css("height", h);

  var ul = $("ul");
  
  $.each(ul, function(){
    $(this).css("height", ($(window).height() - h - 180));
  });

  setTimeout(function(){
    resetSVG();
  }, 200);
}

function resetSVG(){
  panZoomMap.resize();
  panZoomMap.fit();
  panZoomMap.center();
}

const INACTIVE_TIME = 120000; // inactive timer length (1 min)
let inactiveTimeout;

document.onmousemove = resetInactiveTimer;
document.onkeypress = resetInactiveTimer;

function resetInactiveTimer(){
  clearTimeout( inactiveTimeout );
  inactiveTimeout = setTimeout( function() {
    inactiveReset();
  }, INACTIVE_TIME );
}

function inactiveReset(){
  console.log("reseting");
  document.location.reload();
  // resetSVG();
  // $(".active").removeClass("active");
  // $("svg rect").each( function(index) {
  //   let cl = $(this)[0].classList;
  //   let already_active = false;
  //   for( c in cl ){
  //     if( cl[c] === "active" ){
  //       already_active = true;
  //     }
  //   }

  //   if ( already_active === true ){
  //     cl.remove("active");
  //   }
  // });
  // $(".search-bar")[0].value = "";
  // console.log(Meteor);
  // console.log("aaaa");
  // console.log(EasySearch);
  // console.log(ItemsIndex);
  // console.log(ItemsIndex.search(""));
}


Template.search_template.helpers({
  // Indexes are for the searching
  searchIndexes: () => [ItemsIndex, BinsIndex, ShelvesIndex, RoomsIndex],
  itemsIndex: () => ItemsIndex,
  binsIndex: () => BinsIndex,
  shelvesIndex: () => ShelvesIndex,
  roomsIndex: () => RoomsIndex,

  searchBarAttributes: function() {return{ 
    class: "search-bar",
    placeholder: "What are you looking for?"
  };}
});


Template.room_svg_template.helpers({
  rooms(){
    //return ROOMS_DB.find({});
    let r = ROOMS_DB.find({}).fetch();
    for(ri in r){
      r[ri].cent_x = parseFloat(r[ri].x) + parseFloat(r[ri].w)/2;
      r[ri].cent_y = parseFloat(r[ri].y) + 3;
    }
    return(r);
  }
});

Template.shelf_svg_template.helpers({
  shelves(){
    let s = SHELVES_DB.find({}).fetch();
    for(si in s){
      const r = ROOMS_DB.findOne({"_id":s[si].room});
      s[si].room_x = parseFloat(r.x);
      s[si].room_y = parseFloat(r.y);
      s[si].adj_x = s[si].room_x + parseFloat(s[si].x);
      s[si].adj_y = s[si].room_y + parseFloat(s[si].y);
      s[si].cent_x = s[si].adj_x + parseFloat(s[si].w)/2;
      s[si].cent_y = s[si].adj_y + parseFloat(s[si].h)/2;
      s[si].rot = 0;
      if( parseFloat(s[si].h) > parseFloat(s[si].w) ){
        s[si].rot = 90;
        s[si].cent_x -= 0.3;
      }
      else {
        s[si].cent_y += 0.3;
      }
    }
    return(s);
  }
})





Template.add_item_template.helpers({
  bins() {
    return BINS_DB.find({});
  }
});

Template.item_template.events({
  'click li'(event){
    liClickEvent(event);
    
  },
  'click .edit-item'(event){
    event.preventDefault();
    $('.add_item_container').show();

    const parent = $(".add_item_container");
    console.log(event);
    console.log(parent);
    console.log(parent.children("button.add_item_submit"));
    parent.children("button.add_item_submit").text("Update Item");
    parent.attr("name", this._id);
    parent.children("input[name='item_label']")[0].value = this.label || "";
    parent.children("input[name='item_keywords']")[0].value = this.keywords || "";
    parent.children("#bin-select").val(this.bin || "default");
    //Meteor.call('rooms_db.remove', this._id);
  },
  'click .delete-item'(event){
    event.preventDefault();

    Meteor.call('items_db.remove', this._id);
  }
});

Template.search_template.events({
  'click .add_item'(){
    $('.add_item_container').toggle();
    $('.add_item_container').children("button.add_item_submit").text("Add Item");
    $('.add_item_container').attr("name", "");
  },
  'click .add_item_submit'(event){
    event.preventDefault();

    const target = event.target;
    const parent = $(target).parent();
    let label = parent.children("input[name='item_label']")[0].value;
    let keywords = parent.children("input[name='item_keywords']")[0].value;
    let bin = parent.children("#bin-select").val();

    if( keywords != "" && keywords.indexOf(",")!=-1 ){
      keywords = keywords.split(",");
      for (var i = 0; i < keywords.length; i++) {
        keywords[i].trim();
      }
    }
    
    let obj = {};
    obj.label = label;
    obj.bin = bin;
    obj.keywords = keywords;
    console.log(obj);
    
    var attr = parent.attr('name');
    console.log("attr");
    // For some browsers, `attr` is undefined; for others, `attr` is false. Check for both.
    if (typeof attr !== typeof undefined && attr !== false && attr !== "") {
      console.log("updating");
      obj._id = attr;
      Meteor.call('items_db.update', obj);
    }
    else {
      console.log("inserting");
      Meteor.call('items_db.insert', obj);
    }

    parent.children("input[name='item_label']")[0].value = "";
    parent.children("input[name='item_keywords']")[0].value = "";
    parent.children("#bin-select").val("default");
    parent.toggle();
  },
  
});









Template.add_bin_template.helpers({
  shelves() {
    return SHELVES_DB.find({});
  }
});

Template.bin_template.events({
  'click li'(event){
    liClickEvent(event);
  },
  'click .edit-bin'(event){
    event.preventDefault();
    $('.add_bin_container').show();

    const parent = $(".add_bin_container");
    console.log(event);
    console.log(parent);
    console.log(parent.children("button.add_bin_submit"));
    parent.children("button.add_bin_submit").text("Update Bin");
    parent.attr("name", this._id);
    parent.children("input[name='bin_label']")[0].value = this.label || "";
    parent.children("input[name='bin_keywords']")[0].value = this.keywords || "";
    parent.children("#shelf-select").val(this.shelf || "default");
    //Meteor.call('rooms_db.remove', this._id);
  },
  'click .delete-bin'(event){
    event.preventDefault();

    Meteor.call('bins_db.remove', this._id);
  }
});

Template.search_template.events({
  'click .add_bin'(){
    $('.add_bin_container').toggle();
    $('.add_bin_container').children("button.add_bin_submit").text("Add Bin");
    $('.add_bin_container').attr("name", "");
  },
  'click .add_bin_submit'(event){
    event.preventDefault();

    const target = event.target;
    const parent = $(target).parent();
    let label = parent.children("input[name='bin_label']")[0].value;
    let keywords = parent.children("input[name='bin_keywords']")[0].value;
    let shelf = parent.children("#shelf-select").val();

    if( keywords != "" && keywords.indexOf(",")!=-1 ){
      keywords = keywords.split(",");
      for (var i = 0; i < keywords.length; i++) {
        keywords[i].trim();
      }
    }
    
    let obj = {};
    obj.label = label;
    obj.shelf = shelf;
    obj.keywords = keywords;
    console.log(obj);

    var attr = parent.attr('name');
    console.log("attr");
    // For some browsers, `attr` is undefined; for others, `attr` is false. Check for both.
    if (typeof attr !== typeof undefined && attr !== false && attr !== "") {
      console.log("updating");
      obj._id = attr;
      Meteor.call('bins_db.update', obj);
    }
    else {
      console.log("inserting");
      Meteor.call('bins_db.insert', obj);
    }

    parent.children("input[name='bin_label']")[0].value = "";
    parent.children("input[name='bin_keywords']")[0].value = "";
    parent.children("#shelf-select").val("default");
    parent.toggle();
  },
  
});









Template.add_shelf_template.helpers({
  rooms() {
    return ROOMS_DB.find({});
  }
});

Template.shelf_template.events({
  'click li'(event){
    liClickEvent(event);
  },
  'click .edit-shelf'(event){
    event.preventDefault();
    $('.add_shelf_container').show();

    const parent = $(".add_shelf_container");
    console.log(event);
    console.log(parent);
    console.log(parent.children("button.add_shelf_submit"));
    parent.children("button.add_shelf_submit").text("Update Shelf");
    parent.attr("name", this._id);
    parent.children("input[name='shelf_label']")[0].value = this.label || "";
    parent.children("input[name='shelf_keywords']")[0].value = this.keywords || "";
    parent.children("#room-select").val(this.room || "default");
    parent.children("input[name='shelf_x']")[0].value = this.x || "";
    parent.children("input[name='shelf_y']")[0].value = this.y || "";
    parent.children("input[name='shelf_w']")[0].value = this.w || "";
    parent.children("input[name='shelf_h']")[0].value = this.h || "";
    //Meteor.call('rooms_db.remove', this._id);
  },
  'click .delete-shelf'(event){
    event.preventDefault();

    Meteor.call('shelves_db.remove', this._id);
  }
})


Template.search_template.events({
  'click .add_shelf'(){
    $('.add_shelf_container').toggle();
    $('.add_shelf_container').children("button.add_shelf_submit").text("Add Shelf");
    $('.add_shelf_container').attr("name", "");
  },
  'click .add_shelf_submit'(event){
    event.preventDefault();

    const target = event.target;
    const parent = $(target).parent();
    let label = parent.children("input[name='shelf_label']")[0].value;
    let keywords = parent.children("input[name='shelf_keywords']")[0].value;
    let room = parent.children("#room-select").val();
    let x = parent.children("input[name='shelf_x']")[0].value;
    let y = parent.children("input[name='shelf_y']")[0].value;
    let w = parent.children("input[name='shelf_w']")[0].value;
    let h = parent.children("input[name='shelf_h']")[0].value;

    if( keywords != "" && keywords.indexOf(",")!=-1 ){
      keywords = keywords.split(",");
      for (var i = 0; i < keywords.length; i++) {
        keywords[i].trim();
      }
    }
    
    let obj = {};
    obj.label = label;
    obj.room = room;
    obj.keywords = keywords;
    obj.x = x;
    obj.y = y;
    obj.w = w;
    obj.h = h;
    console.log(obj);

    var attr = parent.attr('name');
    console.log("attr");
    // For some browsers, `attr` is undefined; for others, `attr` is false. Check for both.
    if (typeof attr !== typeof undefined && attr !== false && attr !== "") {
      console.log("updating");
      obj._id = attr;
      Meteor.call('shelves_db.update', obj);
    }
    else {
      console.log("inserting");
      Meteor.call('shelves_db.insert', obj);
    }

    //Meteor.call('shelves_db.insert', obj);

    parent.children("input[name='shelf_label']")[0].value = "";
    parent.children("input[name='shelf_keywords']")[0].value = "";
    parent.children("#room-select").val("default");
    parent.children("input[name='shelf_x']")[0].value = "";
    parent.children("input[name='shelf_y']")[0].value = "";
    parent.children("input[name='shelf_w']")[0].value = "";
    parent.children("input[name='shelf_h']")[0].value = "";
    parent.toggle();
  },
  
});









Template.room_template.events({
  'click li'(event){
    liClickEvent(event);
    // const target = event.target;
    // const parent = $(target).closest("li");
    // const p_id = parent.attr('id');
    // parent.toggleClass("active");
    // let cl = $('svg rect#'+p_id)[0].classList;
    // let already_active = false;
    // for( c in cl ){
    //   if( cl[c] === "active" ){
    //     already_active = true;
    //   }
    // }

    // if ( already_active === true ){
    //   cl.remove("active");
    // }
    // else{
    //   cl.add("active");
    // }
  },
  'click .edit-room'(event){
    event.preventDefault();
    $('.add_room_container').show();

    const parent = $(".add_room_container");
    console.log(event);
    console.log(parent);
    console.log(parent.children("button.add_room_submit"));
    parent.children("button.add_room_submit").text("Update Room");
    parent.attr("name", this._id);
    parent.children("input[name='room_label']")[0].value = this.label || "";
    parent.children("input[name='room_keywords']")[0].value = this.keywords || "";
    parent.children("input[name='room_x']")[0].value = this.x || "";
    parent.children("input[name='room_y']")[0].value = this.y || "";
    parent.children("input[name='room_w']")[0].value = this.w || "";
    parent.children("input[name='room_h']")[0].value = this.h || "";
    //Meteor.call('rooms_db.remove', this._id);
  },
  'click .delete-room'(event){
    event.preventDefault();

    Meteor.call('rooms_db.remove', this._id);
  }
});

Template.search_template.events({
  
  'click .add_room'(){
    $('.add_room_container').toggle();
    $('.add_room_container').children("button.add_room_submit").text("Add Room");
    $('.add_room_container').attr("name", "");
  },

  'click .add_room_submit'(event){
    event.preventDefault();

    const target = event.target;
    const parent = $(target).parent();
    let label = parent.children("input[name='room_label']")[0].value;
    let keywords = parent.children("input[name='room_keywords']")[0].value;
    let x = parent.children("input[name='room_x']")[0].value;
    let y = parent.children("input[name='room_y']")[0].value;
    let w = parent.children("input[name='room_w']")[0].value;
    let h = parent.children("input[name='room_h']")[0].value;

    if( keywords != "" && keywords.indexOf(",")!=-1 ){
      keywords = keywords.split(",");
      for (var i = 0; i < keywords.length; i++) {
        keywords[i].trim();
      }
    }
    
    let obj = {};
    obj.label = label;
    obj.keywords = keywords;
    obj.x = x;
    obj.y = y;
    obj.w = w;
    obj.h = h;

    var attr = parent.attr('name');
    console.log("attr");
    // For some browsers, `attr` is undefined; for others, `attr` is false. Check for both.
    if (typeof attr !== typeof undefined && attr !== false && attr !== "") {
      console.log("updating");
      obj._id = attr;
      Meteor.call('rooms_db.update', obj);
    }
    else {
      console.log("inserting");
      Meteor.call('rooms_db.insert', obj);
    }
    
    parent.children("input[name='room_label']")[0].value = "";
    parent.children("input[name='room_keywords']")[0].value = "";
    parent.children("input[name='room_x']")[0].value = "";
    parent.children("input[name='room_y']")[0].value = "";
    parent.children("input[name='room_w']")[0].value = "";
    parent.children("input[name='room_h']")[0].value = "";
    parent.toggle();
  },
  
});

Template.map_list_toggle_template.events({
  'click .map-list-toggle'(event){
    $(".map_img").toggleClass("map_bottom");
    // $("#svg-map").toggleClass("svg-ht");
    let cl = $("#svg-map")[0].classList;
    let already_active = false;
    for( c in cl ){
      if( cl[c] === "svg-ht" ){
        already_active = true;
      }
    }

    if ( already_active === true ){
      cl.remove("svg-ht");
    }
    else{
      cl.add("svg-ht");
    }

    if( $("#list-icon").is(':visible') ){
      console.log("list visible");
      $("#list-icon").hide();
      $("#map-icon").show();
    }
    else {
      $("#map-icon").hide();
      $("#list-icon").show();
    }
  }
});


function liClickEvent(event){
  console.log("li click event");
  let which = "";
  const target = event.target;
  const parent = $(target).closest("li");
  const p_id = parent.attr('id');
  let it,
      bn,
      sh,
      rm;

  if      ( parent.hasClass("item-li") )  which = "ITEM";
  else if ( parent.hasClass("bin-li") )   which = "BIN";
  else if ( parent.hasClass("shelf-li") ) which = "SHELF";
  else if ( parent.hasClass("room-li") )  which = "ROOM";

  parent.toggleClass("active");

  let isActive = parent.hasClass("active");
  console.log(isActive);

  if ( which == "ITEM" ){
    it = ITEMS_DB.findOne({"_id":p_id});
    bn = BINS_DB.findOne({"_id":it.bin});
    sh = SHELVES_DB.findOne({"_id":bn.shelf});
    rm = ROOMS_DB.findOne({"_id":sh.room});
  }
  else if ( which == "BIN" ){
    bn = BINS_DB.findOne({"_id":p_id});
    sh = SHELVES_DB.findOne({"_id":bn.shelf});
    rm = ROOMS_DB.findOne({"_id":sh.room});
  }
  else if ( which == "SHELF" ){
    sh = SHELVES_DB.findOne({"_id":p_id});
    rm = ROOMS_DB.findOne({"_id":sh.room});
  }
  else if ( which == "ROOM" ){
    rm = ROOMS_DB.findOne({"_id":p_id});
  }

  
  if (isActive){
    if ( bn != undefined ) $("li#"+bn._id).addClass("active");
    if ( sh != undefined ) {
      $("li#"+sh._id).addClass("active");
      $("li#"+sh._id).get(0).scrollIntoView();
    }
    if ( rm != undefined ) {
      $("li#"+rm._id).addClass("active");
      $("li#"+rm._id).get(0).scrollIntoView();
    }
  }
  else {
    if ( bn != undefined ) $("li#"+bn._id).removeClass("active");
    if ( sh != undefined ) $("li#"+sh._id).removeClass("active");
    if ( rm != undefined ) $("li#"+rm._id).removeClass("active");
  }


  // SVG stuff for shelves and room
  // if shelf needs to be added, do it
  if ( which != "ROOM" && which != "" && sh != undefined ){
    let cl = $('svg rect#'+sh._id)[0].classList;
    let already_active = false;
    for( c in cl ){
      if( cl[c] === "active" ){
        already_active = true;
      }
    }

    if ( already_active === true ){
      if ( !isActive ){
        cl.remove("active");
      }
    }
    else{
      if ( isActive ){
        cl.add("active");
      }
    }
  }

  

  // set room to active ( always happens )
  if( rm != undefined ){
    cl = $('svg rect#'+rm._id)[0].classList;
    already_active = false;
    for( c in cl ){
      if( cl[c] === "active" ){
        already_active = true;
      }
    }

    if ( already_active === true ){
      if ( !isActive ){
        cl.remove("active");
      }
    }
    else{
      if ( isActive ){
        cl.add("active");
      }
    }
  }
}

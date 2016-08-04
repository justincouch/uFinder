import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import { check } from 'meteor/check';

// items go in bins
// bins go on shelves
// shelves live in rooms
export const   ITEMS_DB = new Mongo.Collection('items_db');
export const    BINS_DB = new Mongo.Collection('bins_db');
export const SHELVES_DB = new Mongo.Collection('shelves_db');
export const   ROOMS_DB = new Mongo.Collection('rooms_db');

// the Index bits are for the EasySearch.
export const  ItemsIndex = new EasySearch.Index({
  collection: ITEMS_DB,
  fields: ['label', 'keywords'],
  engine: new EasySearch.Minimongo(),
  defaultSearchOptions: { limit: 0 },
});
export const  BinsIndex = new EasySearch.Index({
  collection: BINS_DB,
  fields: ['label', 'keywords'],
  engine: new EasySearch.Minimongo(),
  defaultSearchOptions: { limit: 0 },
});
export const  ShelvesIndex = new EasySearch.Index({
  collection: SHELVES_DB,
  fields: ['label', 'keywords'],
  engine: new EasySearch.Minimongo(),
  defaultSearchOptions: { limit: 0 },
});
export const  RoomsIndex = new EasySearch.Index({
  collection: ROOMS_DB,
  fields: ['label', 'keywords'],
  engine: new EasySearch.Minimongo(),
  defaultSearchOptions: { limit: 0 },
});

// if( Meteor.isServer ){
//   items() {
//     return ITEMS_DB.find({});
//   }
// }





// Methods for database use.
Meteor.methods({
  'items_db.insert'(obj){
    check(obj, Object);

    obj.createdAt = new Date();
    // obj.creator = Meteor.userId();
    // obj.username = Meteor.user().username;

    ITEMS_DB.insert(obj);
  },
  'items_db.update'(obj){
    check(obj, Object);

    obj.lastModifiedAt = new Date();
    // obj.creator = Meteor.userId();
    // obj.username = Meteor.user().username;

    ITEMS_DB.update( {"_id":obj._id}, obj );
  },
  'items_db.remove'(item_id){
    check(item_id, String);

    const item = ITEMS_DB.findOne(item_id);
    ITEMS_DB.remove(item_id);
  },


  'bins_db.insert'(obj){
    check(obj, Object);

    obj.createdAt = new Date();
    // obj.creator = Meteor.userId();
    // obj.username = Meteor.user().username;

    BINS_DB.insert(obj);
  },
  'bins_db.update'(obj){
    check(obj, Object);

    obj.lastModifiedAt = new Date();
    // obj.creator = Meteor.userId();
    // obj.username = Meteor.user().username;

    BINS_DB.update( {"_id":obj._id}, obj );
  },
  'bins_db.remove'(bin_id){
    check(bin_id, String);

    const bin = BINS_DB.findOne(bin_id);
    BINS_DB.remove(bin_id);
  },



  'shelves_db.insert'(obj){
    check(obj, Object);

    obj.createdAt = new Date();
    // obj.creator = Meteor.userId();
    // obj.username = Meteor.user().username;

    SHELVES_DB.insert(obj);
  },
  'shelves_db.update'(obj){
    check(obj, Object);

    obj.lastModifiedAt = new Date();
    // obj.creator = Meteor.userId();
    // obj.username = Meteor.user().username;

    SHELVES_DB.update( {"_id":obj._id}, obj );
  },
  'shelves_db.remove'(shelf_id){
    check(shelf_id, String);

    const shelf = SHELVES_DB.findOne(shelf_id);
    SHELVES_DB.remove(shelf_id);
  },



  'rooms_db.insert'(obj){
    check(obj, Object);

    obj.createdAt = new Date();
    // obj.creator = Meteor.userId();
    // obj.username = Meteor.user().username;

    ROOMS_DB.insert(obj);
  },
  'rooms_db.update'(obj){
    check(obj, Object);

    obj.lastModifiedAt = new Date();
    // obj.creator = Meteor.userId();
    // obj.username = Meteor.user().username;

    ROOMS_DB.update( {"_id":obj._id}, obj );
  },
  'rooms_db.remove'(room_id){
    check(room_id, String);

    const room = ROOMS_DB.findOne(room_id);
    ROOMS_DB.remove(room_id);
  },
});
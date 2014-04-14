ContactManager.module('views', function(views, App, Backbone, Marionette, $) {

  views.ContactView = Marionette.ItemView.extend({
    tagName: "li",
    template: "#cont-temp",
    ui: {
      edits: '.edits'
    },

    events: {
      "click p": "alertPhoneNumber",
      "click .delbtn" : "delete",
      "click .editbtn" : "edit",
      "click .savebtn" : "save",
      "click .cancelbtn" : "cancel",
      "dblclick .items" : "edit",
      "keydown .edits" : "keydownedit"
    },

    alertPhoneNumber: function(){alert(this.model.escape("phoneNumber"));},

    delete: function() {
      this.model.destroy();
    },

    edit: function() {
      this.template = "#edit-temp";
      this.render();
    },

    save: function(){
      var dat = {};

      dat["fname"]=this.ui.edits[0].value;
      dat["lname"]=this.ui.edits[1].value;
      dat["phoneNumber"]=this.ui.edits[2].value;

      alert("details: " + dat.fname + dat.lname + dat.phoneNumber);

      this.model.save(dat);
      this.cancel();
    },

    cancel: function() {
      this.template = "#cont-temp";
      this.render();
    },

    keydownedit: function(e) {
    var enterkey = 13;
    if(e.which===enterkey){ this.save();}
    }
  });

  var AddRegion = Marionette.ItemView.extend({
    el: "#addRegion",

    ui: {
      "ab"  : "#addbtn",
      "inp" : ".inputs",
      "s"   : "#search"
    },

    events: {
      "click @ui.ab" : "add",
      "keydown .inputs" : "pressed",
      "keyup @ui.s" : "search"
    },

    search: function() {

      var sItem = $("#search").val();
      if(sItem===""){
        contactsListView.collection.fetch();
        return;
      }
      contactsListView.collection.fetch();
      var f = contactsListView.collection.filter(function(item){
        return item.get("fname").toLowerCase().indexOf(sItem.toLowerCase()) !== -1;
      });

      contactsListView.collection.reset(f);
    },

    add: function(){

      alert("Adding " + $("#fname").val() + " " + $("#lname").val() + " " + $("#phoneNumber").val());

      var data ={};
      $(".inputs").each(function() {data[$(this).attr("id")] = $(this).val()})

      App.vent.trigger('contactAdded', data);

      this.clearFields();

    },

    pressed: function(e) {
      var enterKey = 13;
      if (e.which === enterKey){
        this.add();
      }
    },

    clearFields: function() {
      $(".inputs").each(function() {
        $(this).val("");
      });
      $("#fname").focus();
    }
  });

  new AddRegion();


  views.ContactsView = Marionette.CollectionView.extend({
    tagName: "ul",
    itemView: views.ContactView,
    initialize: function() {
        var self = this;
        App.vent.on('contactAdded', function(eventData) {
              self.collection.create(eventData);
        });

        self.collection.fetch();
    },
    collection: new App.cm.ContactCollection()
  });

  var contactsListView = new views.ContactsView({
    //collection: new App.cm.ContactCollection()
  });

  App.listRegion.show(contactsListView);

  //add default contacts
  contacts.forEach(function(item){
   contactsListView.collection.create(item);
  });

  //contactsListView.collection.create(contacts);

});

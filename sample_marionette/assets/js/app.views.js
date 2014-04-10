ContactManager.module('views', function(views, App, Backbone, Marionette, $) {

  views.ContactView = Marionette.ItemView.extend({
    tagName: "li",
    template: "#cont-temp",
    events: {
      "click p": "alertPhoneNumber",
      "click .delbtn" : "delete",
      "click .editbtn" : "edit",
      "click .savebtn" : "save",
      "click .cancelbtn" : "cancel"
    },

    alertPhoneNumber: function(){alert(this.model.escape("phoneNumber"));},

    delete: function() {
      this.model.destroy();
    },

    edit: function() {
      alert("clicked edit");
      this.template = "#edit-temp";
      this.render();
    },

    save: function(){
      alert("clicked save");
    },

    cancel: function() {
      alert("clicked cancel");
      this.template = "#cont-temp";
      this.render();
    }
  });

  var AddRegion = Marionette.ItemView.extend({
    el: "#addRegion",

    ui: {
      "ab"  : "#addbtn",
      "inp" : ".inputs"
    },

    events: {
      "click @ui.ab" : "add",
      "keydown .inputs" : "pressed"
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
              self.collection.add(eventData);
        });
    }
  });

  var contactsListView = new views.ContactsView({
    collection: new App.cm.ContactCollection()
  });

  App.listRegion.show(contactsListView);

  contactsListView.collection.add(contacts);

});

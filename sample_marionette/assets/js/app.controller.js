ContactManager.module("control", function(control, App, Backbone, Marionette, $) {

  control.Controller = Marionette.Controller.extend({
    initialize: function() {
      App.vent.on("contactAdded", function(data) {
        contactsListView.collection.add(data);
      });
    }

  });
});

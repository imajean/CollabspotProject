ContactManager.module('cm', function(cm, App, Backbone){

  cm.Contact = Backbone.Model.extend({
    defaults: {
      fname: "",
      lname: "",
      phoneNumber: ""
    }
  });

  cm.ContactCollection = Backbone.Collection.extend({
    model: cm.Contact,
    comparator: "fname"
  });

});

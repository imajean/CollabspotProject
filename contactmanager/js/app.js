//@kamijean47
$(function(){
    
    //**Model**
    //create the Contact model class with attributes
    var Contact = Backbone.Model.extend({
        defaults: function(){
            return{
                lastName    : "empty",
                firstName   : "empty",
                email       : "empty",
                phoneNumber : "empty",
                order       : contactList.nextOrder(), //to track the contacts order
                selected    : false //to identify if its checked
            }
        },

        //toggle the checked state of this Contact item
        toggle: function(){
            this.save({selected: !this.get("selected")});
            if(!this.selected) $("#clear-selected").show();
        }
    }); //end of Contact

    //**Collection**
    //create the collection class of our Contact model
    var ContactList = Backbone.Collection.extend({
        model: Contact, //add reference to Contact model
        localStorage: new Backbone.LocalStorage("contact-storage"), //save our contacts' attributes under "contact-storage" namespace in LocalStorage

        //filter down the list of checked items
        checked: function(){
            return this.where({selected: true})
        },

        //filter down the list to only unchecked items
        unchecked: function(){
            return this.where({selected: false})
        },
        
        //to keep track of the order of the contacts, generates the next order number for new items
        nextOrder: function(){
            if(this.length===0) return 1;
            return this.last().get("order")+1;
        },

        comparator: "lastName" //inserted each contact according to lastName
    });//end of ContactList

    var contactList = new ContactList(); //create our global collection of contact list

    //**View**
    //create the DOM element for a contact
    var ContactView = Backbone.View.extend({
        tagName         : "li", //let the tagname of the element be a list
        template        : _.template($("#contact-template").html()), //cache the template function for a single contact using Underscore.js' _.template
        editTemplate    : _.template($("#edit-template").html()), //cache the edit template
        //events specific to an item
        events: {
            "click .toggle"         : "toggleChecked",
            "dblclick .view"        : "edit",
            "click #edit-btn"       : "edit",
            "click #update-btn"     : "update",
            "click #cancel-btn"     : "cancel",
            "click a.destroy"       : "destroy",
            "click .labels"         : "showDetails",
            "keyup #phoneNumber"    : "checkIfNum",
            "keypress .edit"        : "updateOnEnter"
        },

        //the view listens for changes to its model
        initialize: function(){
            this.listenTo(this.model, "change", this.render);
            this.listenTo(this.model, "destroy", this.remove);
        },

        //render property
        render: function(){
            this.$el.html(this.template(this.model.toJSON()));
            this.$el.addClass("");
            this.$el.toggleClass("selected", this.model.get("selected"));
            return this;
        },

        //toggle contacts using the toggle function of the model
        toggleChecked: function(){
            this.model.toggle();
        },

        //switch to editing mode
        edit: function(){
            this.$el.html(this.editTemplate(this.model.toJSON()));
            $(".edit#firstName").focus();
        },

        //exit to editing mode, save changes
        update: function(e){
            var contactData = {};

            $(e.target).closest("div").find(":input").each(function(){
                var el = $(this);
                contactData[el.attr("id")]=el.val();
            });
            var email = contactData.email;
            if(email!="") if(!appView.checkEmail(email)){alertify.alert("Invalid Email."); return;}
            if(contactData.firstName && contactData.lastName){
                this.model.save(contactData);
                this.render();
                alertify.success("Updated "+ this.model.get("firstName") +" "+this.model.get("lastName"));              
            }else foundEmpty();

            this.$el.closest("li").find(".details").show("highlight", 4000);
            this.$el.closest("li").find("label").addClass('active');
            return;
        },

        //upon clicking cancel button
        cancel: function(){
            this.render();
            this.$el.closest("li").find(".details").show("highlight", 2000);
            this.$el.closest("li").find("label").addClass('active');
        },

        //update on pressing enter
        updateOnEnter: function(e){
            if(e.keyCode==13) this.$el.closest("li").find("#update-btn").click();
            return;
        },

        //remove the item, destroy the model
        destroy: function(){
            var first = this.model.get("firstName");
            var last = this.model.get("lastName");
            this.$el.closest("li").hide("explode", 2000);
            alertify.success(first + " " + last +" was successfully deleted");
            this.model.destroy();
            this.reset();
        },

        reset: function () {
            $("#contact-list").empty();
            var list = contactList.models;
            contactList.reset(list);
            stroll.bind('#main ul');
        },

        showDetails: function (e){
            $(e.target).toggleClass('active');
            $(e.target).siblings(".details").slideToggle('fast');
        },

        checkIfNum: function (e) {
            var target = $(e.target).closest("div").find("#phoneNumber");
            var val = target.val();
            if(isNaN(val.trim())){
                alertify.alert("Numbers only!");
                target.val(val.replace(/\D/g, ""));
            }
        }
    }); //end of ContactView

    //**MasterView**
    //create the top level piece of UI
    var AppView = Backbone.View.extend({
        el: $("#appContainer"), //bind to existing skeleton
        statsTemplate: _.template($("#stats-tmpl").html()), //template for the line of statistics at the bottom

        //delegate events for creating and deleting
        events: {
            "click #add-btn"            : "addContact",
            "keypress .input"           : "createOnEnter",
            "keyup #searchBar"          : "search",
            "keyup .input#phoneNumber"  : "checkIfNum",
            "change select"             : "search",
            "click #clear-selected"     : "clearSelected",
            "click #toggle-all"         : "toggleAll"
        },

        //bind contactList to relevant events
        initialize: function(){
            this.listenTo(contactList, "add", this.addOne);
            this.listenTo(contactList, "reset", this.addAll);
            this.listenTo(contactList, "all", this.render);
            this.allCheckbox = this.$("#toggle-all")[0];
            this.main = $("#main");
            this.footer = this.$('footer');
            contactList.fetch(); //load any pre-existing contacts that might have been saved in localStorage
            $("#contact-list").empty();
            var list = contactList.models;
            contactList.reset(list);
            this.uncheckAll();
        },

        //render to change statistics
        render: function(){
            var selected = contactList.checked().length;
            var unchecked = contactList.unchecked().length;
            var total = contactList.length;
            

            if(contactList.length){
                $("#showList").show();
                $(".count").slideToggle();
                this.main.show();
            } else{
                this.main.hide();
            }


            this.footer.html(this.statsTemplate({selected: selected, total: total}));
            this.allCheckbox.checked = !unchecked;
        },

        createOnEnter: function(e){
            if(e.keyCode!=13) return;
            this.addContact();
        },

        //add a contact to the list when new contact is added in the contactList
        addOne: function(contact){
            var contactView = new ContactView({model: contact});
            this.$("#contact-list").append(contactView.render().el);
            var attr = $("select").val();
            if(attr=="phoneNumber" || attr=="email"){
                $(".details").show();
                this.$("#contact-list").closest("li").find(".details").show();
            }
            stroll.bind('#main ul');
        },

        //add all items in the ContactList at once
        addAll: function(){
            contactList.each(this.addOne, this);
        },

        //create new contact in contactList
        addContact: function() {
            var last = $("#lastName").val().trim();
            var first = $("#firstName").val().trim();
            var email = $("#email").val().trim();
            
            if( last && first) {
                if(email!="") if(!this.checkEmail(email)){alertify.alert("Invalid Email."); return;}
                var contactData={};
                $("section .input").each(function (i){
                    contactData[this.id] = $(this).val().trim();
                });
                contactList.create(contactData);
                 $("#firstName").focus();
                 this.show();
                 alertify.success(first + " " + last +" was successfully added");
                //clear input fields after successful addition of contact
                $("section .input").each(function(){
                    $(this).val('');
                });
            }else foundEmpty();
            
        },

        search: function(){
            contactList.fetch({silent: true});
            $("#contact-list").empty();
            var letters = $("#searchBar").val().trim();
            var attribute = $("select").val();
            if(letters==""){
                contactList.fetch();
                this.addAll();
                return;
            }//return if search item is blank
 
            var filtered = contactList.filter(function (item){
                return item.get(attribute).toLowerCase().indexOf(letters.toLowerCase()) !== -1;
            });

            contactList.reset(filtered);
            this.toggleAll();
            this.show();
        },

        toggleAll: function(){
            var checked = this.allCheckbox.checked;
            contactList.each(function (contact){
                contact.save({'selected': checked});
            });
            if(checked) $("#clear-selected").show();
        },

        uncheckAll: function(){
            contactList.each(function (contact){
                contact.save({'selected': false});
            });            
        },

        clearSelected: function(){
            var lngth = contactList.checked().length;
            _.invoke(contactList.checked(), 'destroy');
            this.reset();
            alertify.success(lngth==1?  lngth + " contact successfully deleted":lngth +" contacts successfully deleted");
            return false;
        },

        reset: function () {
            $("#contact-list").empty();
            var list = contactList.models;
            contactList.reset(list);
            stroll.bind('#main ul');
        },

        show: function () {
            $("#cont").show("clip", 500);
            $("#clear-selected").show("clip", 500);
            stroll.bind('#main ul');
        },

        checkIfNum:function () {
            var val = $(".input#phoneNumber").val();
            if(isNaN(val.trim())){
                alertify.alert("Numbers only!");
                $(".input#phoneNumber").val(val.replace(/\D/g, ""));
            }
        },

        checkEmail: function (email) {
            var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
            return re.test(email);
        }
    });
     
    var appView = new AppView(); //create the app
    var foundEmpty = function(){ alertify.alert("Fields with * are required.");} //prompt if one or both required fields are empty

    //show add contact fields
    $("#new-btn").click(function(){
        $( "#addSection" ).show( "fold", 600 );
        $("#firstName").focus();
    });

    $("#close-btn").click(function(){
        $( "#addSection" ).hide( "explode", 600 );
        $("section .input").each(function(){
            $(this).val('');
        });
    });    

    $("#showList").click(function(){
        $("#cont").toggle("clip", 500);
        $("#clear-selected").slideToggle();
        stroll.bind('#main ul');
    });

    stroll.bind('#main ul');

    alertify.log('Welcome :) _ j e a n _');
});
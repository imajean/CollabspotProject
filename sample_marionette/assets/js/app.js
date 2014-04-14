var ContactManager = new Marionette.Application();

ContactManager.addRegions({
  listRegion: "#listRegion",
  editRegion: "li"
});

  var contacts = [
  {
    fname: "zob",
    lname: "rich",
    phoneNumber: 12345
  },

  {
    fname: "cal",
    lname: "rih",
    phoneNumber: 1656
  },

  {
    fname: "ael",
    lname: "rch",
    phoneNumber: 7895
  }
  ];

ContactManager.start();

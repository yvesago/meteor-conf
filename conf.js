Events = new Meteor.Collection('events');


/**
*  DB access for every user
**/

Events.allow({
  update: function (userId, doc) {
    if (userId) {
      return true;
    }
    return false;
  },
  insert: function (userId, doc) {
    if (userId) {
      return true;
    }
    return false;
  }
});


/**
*  Global config
**/

Accounts.config({
      forbidClientAccountCreation: true
});   
    
// Set lang for i18n and date time moment library
//i18n.setLanguage(Meteor.settings.public.lang);
moment.locale(Meteor.settings.public.lang);

/**
*  Client config
**/

if (Meteor.isClient) {

Meteor.subscribe('events');

/*
 Set title with Meteor.settings.public.appName
 Allow to change name for test, dev, prod environments
*/
Meteor.startup(function () {
    Meteor.autorun(function () {
        document.title = Meteor.settings.public.appName;
    });
});

/* Global template helpers

appName, firstDate, dateFormat

*/
Template.registerHelper('appName', function (opts) {
            return Meteor.settings.public.appName;
});

Template.registerHelper('firstDate', function (opts) {
            return Meteor.settings.public.firstDate;
});

/* Helper to format dates
  Usage: 
  {{dateFormat creation_date}} 
   or
  {{dateFormat creation_date format="MMMM YYYY"}}
*/
Template.registerHelper('dateFormat', function(context, block) {
    if (window.moment) {
       var f = block.hash.format;// || "MMM DD, YYYY hh:mm:ss A";
       return (context)?moment(context).format(f):' '; }
      else {
       return context;   //  moment plugin not available. return data as is.
    };
  });


//** Page myconf
//   helpers fo myconf page
Template.myconf.helpers({
  events : function() {
     return Events.find( { $or: [
         {'view': Meteor.user().emails[0].address},
         {'report': Meteor.user().emails[0].address}]
      },
      {sort: {start: 1, className: 1}}
      ); 
  },
  report: function() {
    return this.report;
  },
  checkreport: function() {
    return _.contains( this.report, Meteor.user().emails[0].address );
  } 
});


//** Page signin
//   event for signin page
Template.signin.events({
    'click .login-btn': function (event, template) {
        event.preventDefault();
        Meteor.loginWithCas();
    }
});


//** Page dialog
//   events for dialog  
Template.dialog.events({
  'click .closeDialog': function(event,template) {
      Session.set('editing.event', null);
  },
  'click .save': function(event,template) {
      var form = $('#eventModifyModal form');
      App.updateEvent(Session.get('editing.event'),
         form.find('#event-toreport').prop('checked'), 
         form.find('#event-report').prop('checked'),
         form.find('#event-toview').prop('checked') 
        );
      Session.set('editing.event', null);
      $('#eventModifyModal').modal('hide');
  }
});

//   helpers for dialog
Template.dialog.helpers({
  event: function() {
    var editing_event = Session.get('editing.event');
    var e;
    if (editing_event) {
        e = Events.findOne({_id: editing_event});
    };
    return e;
  },
  checkview: function() {
    var editing_event = Session.get('editing.event');
    var e;
    if (editing_event) {
        e = Events.findOne({_id: editing_event});
        //return _.contains( e.view, Meteor.userId() );
        return _.contains( e.view, Meteor.user().emails[0].address );
    };
    return false;
  }, 
  checkreport: function() {
    var editing_event = Session.get('editing.event');
    var e;
    if (editing_event) {
        e = Events.findOne({_id: editing_event});
        //return _.contains( e.report, Meteor.userId() );
        return _.contains( e.report, Meteor.user().emails[0].address );
    };
    return false;
  } 
});

//** Page calendar
//   events for calendar page
Template.start.events({
    'click .reload': function (event, template) {
        event.preventDefault();
        $('#calendar').fullCalendar( 'gotoDate', Meteor.settings.public.firstDate );
    }
});


//   functions for calendar page 
var App = {};
App.getEvents = function (start, end) {
  var events = Events.find({},
  //{sort: {className: 1, start: 1}}
  );
  return events;
};

App.mapDbEventsToEventSource = function (eventCursor) {
  var eventArray = [];
  eventCursor.forEach(function (eventData) {
    var title = eventData.title;
    var color = '#3a87ad';
    if ( eventData.className === 'Salle4')
        color = '#ad433a';
    if ( eventData.className === 'Salle3')
        color = '#FFFF55';
    if ( eventData.className === 'Salle2' )
         color = '#DDFFCC';
    var cName = "";
    if ( eventData.toreport ) 
         cName = "moreBorder";
    var event = {
      title: title,
      start: eventData.start,
      end: eventData.end,
      _id: eventData._id,
      report: eventData.report,
      view: eventData.view,
      className: cName,
      textColor: '#555555',
      color: color
    };
    eventArray.push(event);
  });
  return eventArray;
};

App.updateEvent = function (id,toreport,report,view) {
 var  e = Events.findOne({_id: id});
 var r = e.report || [];
 //r = _.without( r, Meteor.userId() );
 r = _.without( r, Meteor.user().emails[0].address );
 if (report) {
  //r.push(Meteor.userId());
  r.push( Meteor.user().emails[0].address );
 };
 var v = e.view || [];
 v = _.without( v, Meteor.user().emails[0].address );
 if (view) {
  v.push( Meteor.user().emails[0].address );
 };
 Events.update( id,
   { $set: { 
     'toreport': toreport , 
     'view': v,
     'report': r 
      }
   }, 
   function( error, result) { 
      if ( error ) console.log ( 'err ' + error ); 
     }
 );
};

//   render for calendar page 
//   fullCalendar setup 
Template.calendar.rendered = function () {
  $('#calendar').fullCalendar({
    header: {
      //left: 'prev,next today',
      left: 'prev,next',
      center: 'title',
      right: 'month,agendaWeek,agendaDay'
    },
    hiddenDays: Meteor.settings.public.hiddenDays,
    slotDuration: '0:15:00',
    minTime: '08:45:00',
    maxTime: '18:30:00',
    defaultView : 'agendaWeek',
    lang: 'fr',
    timezone: 'Europe/Paris',
    height: 'auto',
    slotEventOverlap: false,
    displayEventEnd: true,
    editable: false,
    events: function (start, end, timezone, callback) {
      var events = App.getEvents(start, end);
      var eventSource = App.mapDbEventsToEventSource(events);
      callback(eventSource);
    },
    eventOrder: ["color","end"],
    eventClick: function(calEvent, jsEvent, view) {
        jsEvent.preventDefault();
        Session.set('editing.event',calEvent._id);
        $('#eventModifyModal').modal('show');
    },
    eventRender: function(event, element) {
        var span = $(document.createElement('span'));
        var e = $(element).find('.fc-title');
        var t = '';
        _.each(event.report, function() {
            t = t + '★';
        });
        if ( _.contains( event.view, Meteor.user().emails[0].address )) {
            t = t + '☆';
        };
        e.html(t + event.title);// + "<br />\n" + event.report);
    },
  });
  // autorun on this page
  this.autorun( function() {
        $('#calendar').fullCalendar( 'gotoDate', Meteor.settings.public.firstDate );
        var events = Events.find({});
        if (events.count()) {
                $('#calendar').fullCalendar('refetchEvents');
        };
        });
};

} // if client

/**
* Server config 
**/
if (Meteor.isServer) {

  //** Code to run on server at startup

  Meteor.startup(function () {

  // Create default local Users from settings
  if (Meteor.users.find().fetch().length === 0) {
    console.log('Creating default local users: ');
    var users = Meteor.settings.default.users;

    _.each(users, function (userData) {
      var id, user;

      console.log(userData);

      id = Accounts.createUser({
        email: userData.email,
        password: Meteor.settings.default.password,
        profile: { name: userData.name }
      });

      // email verification
      Meteor.users.update({_id: id}, {$set:{'emails.0.verified': true}});

      Roles.addUsersToRoles(id, userData.roles);

    });
  }

  // Set default roles
  if (_.isString(Meteor.settings.appAdmin)) {
    console.log("Checking admin role for "+Meteor.settings.appAdmin);
    var user = Meteor.users.findOne({username: Meteor.settings.appAdmin});
    if (user) {
      console.log(Meteor.settings.appAdmin+" found");
      if (Roles.userIsInRole(user._id, "admin")) {
        console.log(Meteor.settings.appAdmin+" already has admin role");
      } else {
        console.log("set admin role to "+Meteor.settings.appAdmin);
        Roles.addUsersToRoles(user._id, ['admin'] );
      }
    }
  }


  });

  //**  Data published by server
  // Publish all roles
    Meteor.publish(null, function (){
          return Meteor.roles.find()
    });

  // Authorized users can manage user accounts
    Meteor.publish("users", function () {
      var user = Meteor.users.findOne({_id:this.userId});

      if (Roles.userIsInRole(user, ["admin","manage-users"])) {
        // console.log('publishing users', this.userId)
        return Meteor.users.find({}, {fields: {emails: 1, profile: 1, roles: 1}});
      }

      this.stop();
      return;
    });

  // Publish calendar events
  Meteor.publish('events', function (start, end) {
    return Events.find({
        $or: [
            {date: {$gte: start}},
            {date: {$lte: end}}
        ]
    });
  });

} // if server

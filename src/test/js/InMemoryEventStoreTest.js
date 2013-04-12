
module("InMemoryEventStore");

test("create", function(){

    var eventStore = new JSEE.InMemoryEventStore();
    ok(eventStore, "create new instance");
    
});


test("store event", function(){
    var eventStore = new JSEE.InMemoryEventStore();
    var MESSAGE = "message";
    
    var actualId = eventStore.store({
        message : MESSAGE
    });
    
    ok(actualId, "ID is created");
    var storedEvents = eventStore.getStoredEvents();
    equal(storedEvents.length, 1, "Number of stored events");
    
    var actualEvent = storedEvents[0];
    
    assertEqualEvent(actualEvent, {
        id: actualId,
        message: MESSAGE
    });
    
}); 


test("callback", function() {
    var eventStore = new JSEE.InMemoryEventStore();    
    var MESSAGE = "message";
    
    var actualEvent;
    var actualId = eventStore.store(
        {
            message : MESSAGE
        }, 
        function(event){
        //This is in-memory storage it executes fundler at once
        actualEvent = event;        
        
        var storedEvents = eventStore.getStoredEvents();
        deepEqual(storedEvents, [actualEvent], "Event has been stored already");
    });
    assertEqualEvent(actualEvent, {
        id: actualId,
        message: MESSAGE
    });
});

test("event listener", function() {
    var eventStore = new JSEE.InMemoryEventStore();    
    var MESSAGE = "message";
    
    var actualEvent;
    eventStore.addEventListener(function(event) {
        actualEvent = event;
        ok(actualEvent, "event received");
    });
    
    var actualId = eventStore.store({
        message : MESSAGE
    });
    
    assertEqualEvent(actualEvent, {
        id: actualId,
        message: MESSAGE
    });
    
});





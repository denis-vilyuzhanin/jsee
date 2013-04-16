
module("InMemoryEventStore");

test("create", function(){

    var eventStore = new JSEE.InMemoryEventStore();
    ok(eventStore, "create new instance");
    
});

/**
 * Any event could be stored in background. Without providing callback function.
 * 
 */
test("store event in background", function(){
    var eventStore = new JSEE.InMemoryEventStore();
    var DATA = "data";
    
    var eventId = eventStore.store(DATA);
    
    ok(eventId, "ID is created");
}); 


test("callback", function() {
    expect(4);
    var eventStore = new JSEE.InMemoryEventStore();    
    var DATA = "data";
    
    var eventId = eventStore.store(DATA, function(event){
        ok(event.id(), "ID is assigned");        
        equal(event.data(), DATA, "Data is stored");
        
        var storedEvent = eventStore.get(event.id());
        deepEqual(event, storedEvent, "Event is stored");
    });
    ok(eventId, "ID is created");
});

test("event listener", function() {
    var eventStore = new JSEE.InMemoryEventStore();    
    var DATA = "data";
    
    eventStore.addEventListener(function(event) {
        ok(event.id(), "ID is assigned");        
        equal(event.data(), DATA, "Data is stored");
        
        var storedEvent = eventStore.get(event.id());
        deepEqual(event, storedEvent, "Event is stored");
    });
    
    var eventId = eventStore.store(DATA);
    ok(eventId, "ID is created");
});





module("Perspective");

test("create new perspective", function(){
    var DATA = "Hello"
    var perspective = new JSEE.Perspective({
        create : function(event) {
            return 
        }
    });
    var previousState = null;
    var event = new JSEE.Event(DATA);
    
    var newState = perspective.apply(previousState, event);
    
    equal(newState, {
        id : event.id,
        message : "Hello"
    });
});
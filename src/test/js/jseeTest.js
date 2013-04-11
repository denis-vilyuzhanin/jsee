
JSEE_TEST = true


function WindowMock() {
}


function DocumentMock() {
    
}

windowMock = new WindowMock();
documentMock = new DocumentMock();

JSEE = JSEE_MODULE(windowMock, documentMock);



function EventMock(message) {
   this.message = message;
}

EventMock.prototype.clone = function() {
    var newInstance = new EventMock(this.message)
    return newInstance;
}


function assertEqualEvent(actualEvent, expectedEvent) {
    ok(actualEvent, "actual event");
    ok(actualEvent.id, "ID was assigned");
    equal(actualEvent.id, expectedEvent.id, "event ID");
    equal(actualEvent.message, expectedEvent.message, "event message");
}

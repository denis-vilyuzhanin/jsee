


function JSEE_MODULE(window, document) {
    
    function randonUUID() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(
                /[xy]/g, 
                function(c) {
                    var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
                    return v.toString(16);
                });
    }
    
    function cloneObject(object) {
        if (object.clone) {
            return object.clone();
        }
        var str = JSON.stringify(object);
        return JSON.parse(str);
    }

/////////////////////////////////////////
//      InMemoryEventStore
/////////////////////////////////////////
    function Event(data) {
        this.id = randonUUID();
        this.data = data;
    }
    Event.prototype.clone = function() {
        var clone = new Event(cloneObject(this.data));
        clone.id = this.id;
        return clone;
    }
/////////////////////////////////////////


/////////////////////////////////////////
//      InMemoryEventStore
/////////////////////////////////////////

    function InMemoryEventStore() {
        this._events = new Array();
        this._idIndex = new Object();
        this._listeners = new Array();
    }
    
    InMemoryEventStore.prototype = {
        /**
         * 
         */
        store : function(data, callback) {
            
            var event = new Event(data);
            
            this._events.push(event.clone());
            this._idIndex[event.id] = this._events.length - 1;
            
            this._notifyAllListeners(event);
            
            if (callback) {
                callback(event);
            }
            
            return event.id;
        },
        
        /**
         * 
         */
        get : function(id) {
            var index = this._idIndex[id];
            return this._events[index];    
        },
        
        /**
         * 
         */
         addEventListener : function(listener) {
            this._listeners.push(listener);    
         },
         
         _notifyAllListeners : function(event) {
             for(var i in this._listeners) {
                 var listener = this._listeners[i];
                 listener(event);
             }
         }
    };
    
/////////////////////////////////////////

    return {
        InMemoryEventStore : InMemoryEventStore,
        Event: Event
    };
}

if (typeof JSEE_TEST == 'undefined') {
    JSEE = JSEE_MODULE(window, document);    
 
    
}



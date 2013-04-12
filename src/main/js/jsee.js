


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

    function InMemoryEventStore() {
        this._events = new Array();
        this._listeners = new Array();
    }
    
    InMemoryEventStore.prototype = {
        /**
         * 
         */
        store : function(event, callback) {
            var id = randonUUID();
            var clonedEvent = cloneObject(event);
            clonedEvent.id = id;
            
            this._events.push(clonedEvent);
            if (callback) {
                callback(clonedEvent);
            }
            this._notifyAllListeners(clonedEvent);
            
            return id;
        },
        
        /**
         * 
         */
        getStoredEvents : function() {
            return this._events;    
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
        InMemoryEventStore : InMemoryEventStore
    };
}

if (typeof JSEE_TEST == 'undefined') {
    JSEE = JSEE_MODULE(window, document);    
 
    
}



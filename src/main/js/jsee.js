


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
//      Map
/////////////////////////////////////////
    function Map() {
        this._map = {};
    }
    Map.prototype.put = function(key, value) {
        this._map[key] = value;
    }
    Map.prototype.get = function(key) {
        return this._map[key];
    }
    
/////////////////////////////////////////
//      Set
/////////////////////////////////////////
    function Set() {
        this._map = {};
    }
    Set.prototype.add = function(value) {
        this._map[value] = value;
    }
    Set.prototype.isContains = function(value) {
        return this._map[value] != undefined;
    }
/////////////////////////////////////////
//      LinkedMap
/////////////////////////////////////////
    function LinkedMap() {
        this._map = {};
        this._list = new Array();
    }
    LinkedMap.prototype.put = function(key, value) {
        this._list.push(value);
        this._map[key] = this._list.length - 1;
    }
    LinkedMap.prototype.get = function(key) {
        var index = this._map[key];
        if (index == undefined) {
            return undefined;
        }
        return this._list[index];
    }
/////////////////////////////////////////
    

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
    function State(data) {
        this.data = data;
    }
/////////////////////////////////////////

/////////////////////////////////////////
//      EventDefinition
/////////////////////////////////////////
    function EventDefinition(typeObject) {
        this._typeObject = typeObject;
    }
    EventDefinition.prototype.typeObject = function() {
        return this._typeObject;
    }
    EventDefinition.toIdString = function(typeObject) {
        return typeObject.toString();    
    }
    EventDefinition.prototype.id = function() {
        return EventDefinition.toIdString(this._typeObject);
    }
    
/////////////////////////////////////////

/////////////////////////////////////////
//      ModelDefinition
/////////////////////////////////////////
    function ModelDefinition(typeObject) {
        this._typeObject = typeObject;

        //TODO: add default implementation of apply function which takes apply attribute 
        // from perspective object and invoce it. If apply attribute is an object then
        // use event type as key to fetch implementation.
        // MyPerspective.prototype.apply = {MyEvent: function(event, perspective){ ... }}
        
        this._createFunction = null;
        this._applyFunctions = new Map();
        this._matchFunctions = new Map();
        this._initialEvents = new Set();
        
    }
    ModelDefinition.toIdString = function(typeObject) {
        return typeObject.toString();    
    }
    ModelDefinition.prototype.id = function() {
        return ModelDefinition.toIdString(this._typeObject);
    }
    ModelDefinition.prototype.typeObject = function() {
        return this._typeObject;
    }
    ModelDefinition.prototype.applyFunctions = function() {
        return this._applyFunctions;
    }
    ModelDefinition.prototype.initialEvents = function() {
        return this._initialEvents;
    }
    ModelDefinition.prototype.matchFunctions = function() {
        return this._matchFunctions;
    }
    ModelDefinition.prototype.createFunction = function(value) {
        if (arguments.length > 0) {
            this._createFunction = value;
        }
        return this._createFunction;
    }
    
/////////////////////////////////////////

/////////////////////////////////////////
//      ModelDefinitionBuilder
/////////////////////////////////////////

    function ModelDefinitionBuilder(context, model) {
        this._context = context;
        this._model = model;
    }
    ModelDefinitionBuilder.prototype.create = function(createFunction) {
        this._model.createFunction(createFunction);
        return this;
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

/////////////////////////////////////////
//      JSEE Container
/////////////////////////////////////////

    function EventProcessingBuilder(container, eventDefinition) {
        this._container = container;
        this._event = eventDefinition;
        this._model = null;
        this._action = null;
    }
    
    EventProcessingBuilder.CREATE_PERSPECTIVE_ACTION = "perspective.create";
    EventProcessingBuilder.UPDATE_PERSPECTIVE_ACTION = "perspective.update";
    
    EventProcessingBuilder.prototype.create = function(model) {
        this._action = EventProcessingBuilder.CREATE_PERSPECTIVE_ACTION;
        this._model = this._container.getModelDefinition(model);
        return this;
    }
    
    EventProcessingBuilder.prototype.update = function(model) {
        this._action = EventProcessingBuilder.UPDATE_PERSPECTIVE_ACTION;
        this._model = this._container.getModelDefinition(model);
        return this;
    }
    
    EventProcessingBuilder.prototype.as = function(applyFunction) {
        if (EventProcessingBuilder.CREATE_PERSPECTIVE_ACTION == this._action) {
            this._model.initialEvents().add();
        }
        this._model.applyFunctions().put(this._event.id(), applyFunction);
        return this;
    }
    EventProcessingBuilder.prototype.by = function(matchFunction) {
        this._model.matchFunctions().put(this._event.id(), matchFunction);
        return this;
    }
    
/////////////////////////////////////////

/////////////////////////////////////////
//      JSEE Container
/////////////////////////////////////////

    function Container() {
        this._events = new LinkedMap();
        this._models = new LinkedMap();
    } 
    
    Container.prototype = {
        Container : Container,
        InMemoryEventStore : InMemoryEventStore,
        Event: Event,
    };
    Container.prototype.event = function(eventType) {
        var eventDefinition = new EventDefinition(eventType);
        this._events.put(eventDefinition.id(), eventDefinition);
    }
    Container.prototype.model = function(modelType) {
        var modelDefinition = new ModelDefinition(modelType);
        this._models.put(modelDefinition.id(), modelDefinition);
        return new ModelDefinitionBuilder(this, modelDefinition);
    }
    
    Container.prototype.when = function(eventType) {
        var eventDefinition = this.getEventDefinition(eventType);
        return new EventProcessingBuilder(this, eventDefinition);
    }
    
    Container.prototype.getEventDefinition = function(eventType) {
        var eventDefinition = 
            this._events.get(EventDefinition.toIdString(eventType));
        if (!eventDefinition) {
            throw "Undefined event type: " + eventType;
        }
        return eventDefinition;
    }
    
    Container.prototype.getModelDefinition = function(modelType) {
        var modelDefinition = 
            this._models.get(ModelDefinition.toIdString(modelType));
        if (!modelDefinition) {
            throw "Undefined model type: " + modelType;
        }
        return modelDefinition;
    }
/////////////////////////////////////////

    return new Container();
}

if (typeof JSEE_TEST == 'undefined') {
    JSEE = JSEE_MODULE(window, document);    
 
    
}



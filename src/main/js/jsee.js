


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
    
    function determineObjectType(object) {
        return object.constructor;
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
        return this._map[value] !== undefined;
    }
/////////////////////////////////////////
//      LinkedMap
/////////////////////////////////////////
    function LinkedMap() {
        this._map = {};
        this._list = [];
    }
    LinkedMap.prototype.put = function(key, value) {
        this._list.push(value);
        this._map[key] = this._list.length - 1;
    }
    LinkedMap.prototype.get = function(key) {
        var index = this._map[key];
        if (index === undefined) {
            return undefined;
        }
        return this._list[index];
    }
/////////////////////////////////////////
    

/////////////////////////////////////////
//      InMemoryEventStore
/////////////////////////////////////////
    function Event(data) {
        this._id = randonUUID();
        this._data = data;
    }
    Event.prototype.id = function() {
        return this._id;
    }
    Event.prototype.data = function() {
        return this._data;
    }
    Event.prototype.clone = function() {
        var clone = new Event(cloneObject(this.data()));
        clone._id = this._id;
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
    function EventDefinition(dataType) {
        this._dataType = dataType;
        this._models = new Set();
    }
    EventDefinition.prototype.typeObject = function() {
        return this._dataType;
    }
    EventDefinition.toIdString = function(dataType) {
        return dataType.toString();    
    }
    EventDefinition.prototype.id = function() {
        return EventDefinition.toIdString(this._dataType);
    }
    EventDefinition.prototype.models = function() {
        return this._models;
    }
    
/////////////////////////////////////////

/////////////////////////////////////////
//      ModelDefinition
/////////////////////////////////////////
    function ModelDefinition(dataType) {
        this._dataType = dataType;

        //TODO: add default implementation of apply function which takes apply attribute 
        // from perspective object and invoce it. If apply attribute is an object then
        // use event type as key to fetch implementation.
        // MyPerspective.prototype.apply = {MyEvent: function(event, perspective){ ... }}
        
        this._createFunction = null;
        this._applyFunctions = new Map();
        this._matchFunctions = new Map();
        this._initialEvents = new Set();
        
    }
    ModelDefinition.toIdString = function(dataType) {
        return dataType.toString();    
    }
    ModelDefinition.prototype.id = function() {
        return ModelDefinition.toIdString(this._dataType);
    }
    ModelDefinition.prototype.dataType = function() {
        return this._dataType;
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
        this._events = [];
        this._idIndex = {};
        this._listeners = [];
    }
    
    InMemoryEventStore.prototype = {
        /**
         * 
         */
        store : function(data, callback) {
            
            var event = new Event(data);
            
            this._events.push(event.clone());
            this._idIndex[event.id()] = this._events.length - 1;
            
            this._notifyAllListeners(event);
            
            if (callback) {
                callback(event);
            }
            
            return event.id();
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
        this._eventDefinition = eventDefinition;
        this._modelDefinition = null;
        this._action = null;
    }
    
    EventProcessingBuilder.CREATE_PERSPECTIVE_ACTION = "perspective.create";
    EventProcessingBuilder.UPDATE_PERSPECTIVE_ACTION = "perspective.update";
    
    EventProcessingBuilder.prototype.create = function(modelDefinition) {
        this._action = EventProcessingBuilder.CREATE_PERSPECTIVE_ACTION;
        this._modelDefinition = this._container.getModelDefinition(modelDefinition);
        return this;
    }
    
    EventProcessingBuilder.prototype.update = function(modelDefinition) {
        this._action = EventProcessingBuilder.UPDATE_PERSPECTIVE_ACTION;
        this._modelDefinition = this._container.getModelDefinition(modelDefinition);
        return this;
    }
    
    EventProcessingBuilder.prototype.as = function(applyFunction) {
        if (EventProcessingBuilder.CREATE_PERSPECTIVE_ACTION == this._action) {
            this._modelDefinition.initialEvents().add();
        }
        this._modelDefinition.applyFunctions().put(this._eventDefinition.id(), 
                                         applyFunction);
        this._eventDefinition.models().add(this._modelDefinition.id())
        return this;
    }
    EventProcessingBuilder.prototype.by = function(matchFunction) {
        this._modelDefinition.matchFunctions().put(this._eventDefinition.id(), 
                                                   matchFunction);
        return this;
    }
    
/////////////////////////////////////////

/////////////////////////////////////////
//      EventProcessor
/////////////////////////////////////////

    function EventProcessor(context, eventDefinition) {
        this._context = context;
        this._eventDefinition = eventDefinition;
    }
    EventProcessor.prototype.process = function(event) {
        
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
    
    Container.prototype.when = function(eventDataType) {
        var eventDefinition = this.getEventDefinition(eventDataType);
        return new EventProcessingBuilder(this, eventDefinition);
    }
    
    Container.prototype.getEventDefinition = function(eventDataType) {
        var eventDefinition = 
            this._events.get(EventDefinition.toIdString(eventDataType));
        if (!eventDefinition) {
            throw "Undefined event type: " + eventDataType;
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
    
    Container.prototype.apply = function(eventData) {
        var eventType = determineObjectType(eventData);
        var eventDefinition = this.getEventDefinition(eventType);
        
        var processor = new EventProcessor(this, eventDefinition);
        var event = new Event(eventData);
        processor.process(event);
        return event.id();
    }
/////////////////////////////////////////

    return new Container();
}

if (typeof JSEE_TEST == 'undefined') {
    JSEE = JSEE_MODULE(window, document);    
 
    
}



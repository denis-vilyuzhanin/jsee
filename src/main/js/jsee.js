


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
        var clone = JSON.parse(str);
        
        return clone;
    }
    
    function determineObjectType(object) {
        return object.constructor;
    }
    
    function convertToDataType(object) {
        if (typeof(object) == 'string') {
            return object;
        } else if (typeof(object) == 'function') {
            return object.name;
        }
        throw "Unsupported data type. Please use string or function";
    }
    
    function defaultStoreFunction(object) {
        return object;
    }
    
    function defaultRestoreFunction(json) {
        return json;
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
    LinkedMap.prototype.getIndex = function(key) {
        return this._map[key];
    }    
    LinkedMap.prototype.getByIndex = function(index) {
        return this._list[index];   
    }
    LinkedMap.prototype.size = function() {
        return this._list.length;
    }
    
/////////////////////////////////////////
    

/////////////////////////////////////////
//      InMemoryEventStore
/////////////////////////////////////////
    function Event(data, type) {
        this._id = randonUUID();
        this._data = data;
        if (type == undefined) {
            type = convertToDataType(determineObjectType(data));
        }
        this._type = type;
    }
    Event.prototype.id = function() {
        return this._id;
    }
    Event.prototype.type = function() {
        return this._type;
    }
    Event.prototype.data = function() {
        return this._data;
    }
    Event.prototype.clone = function() {
        var clone = new Event(cloneObject(this.data()));
        clone._id = this._id;
        clone._type = this._type;
        return clone;
    }
/////////////////////////////////////////

/////////////////////////////////////////
//      Definition
/////////////////////////////////////////
    function Definition() {
        this._storeFunction = defaultStoreFunction;
        this._restoreFunction = defaultRestoreFunction;
    }
    Definition.prototype.isEvent = function() {
        throw "Definition.isEvent() is abstract and must be implemented";
    }
    Definition.prototype.storeFunction = function(value) {
        if (arguments.length > 0) {
            this._storeFunction = value;
        }
        return this._storeFunction;
    }
    Definition.prototype.restoreFunction = function(value) {
        if (arguments.length > 0) {
            this._restoreFunction = value;
        }
        return this._restoreFunction;
    }
/////////////////////////////////////////

/////////////////////////////////////////
//      EventDefinition
/////////////////////////////////////////
    function EventDefinition(dataType) {
        this._dataType = dataType;
        this._models = new Set();
    }
    EventDefinition.prototype = new Definition();
    
    EventDefinition.prototype.isEvent = function() {
        return true;
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
//      EventDefinitionBuilder
/////////////////////////////////////////
    function EventDefinitionBuilder(container, eventDefinition) {
        this._context = container;
        this._eventDefinition = eventDefinition;    
    }
    EventDefinitionBuilder.prototype.storeAs = function(storeFunction) {
        this._eventDefinition.storeFunction(storeFunction);
        return true;
    }
    EventDefinitionBuilder.prototype.restoreAs = function(restoreFunction) {
        this._eventDefinition.restoreFunction(restoreFunction);
        return true;
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
    ModelDefinition.prototype = new Definition();
    ModelDefinition.prototype.isEvent = function() {
        return false;
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

    function InMemoryEventStore(container, params) {
        this._container = container;
        this._eventsLog = new LinkedMap();
        this._listeners = [];
    }
    
    InMemoryEventStore.prototype.store = function(event, callback) {
            this._eventsLog.put(event.id(), event.clone());
            this._notifyAllListeners(event);
            if (callback) {
                callback(event);
            }
            return event.id();
    };
    
    InMemoryEventStore.prototype.selectFrom = function(id, callback) {
        var i = this._eventsLog.getIndex(id);
        var thisObject = this;
        callback(function(){
            return thisObject._eventsLog.getByIndex(i++);    
        });
    }
    
    InMemoryEventStore.prototype.get = function(id, callback) {
            var event = this._eventsLog.get(id);
            if (callback !== undefined) {
                callback(event);
            }
            return event;
    }
    
    InMemoryEventStore.prototype.addEventListener = function(listener) {
            this._listeners.push(listener);    
    }
    
    InMemoryEventStore.prototype. _notifyAllListeners = function(event) {
             for(var i in this._listeners) {
                 var listener = this._listeners[i];
                 listener(event);
             }
    }
    
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
    
    EventProcessingBuilder.prototype.create = function(modelObjectType) {
        this._action = EventProcessingBuilder.CREATE_PERSPECTIVE_ACTION;
        this._modelDefinition = this._container.getModelDefinition(modelObjectType);
        return this;
    }
    
    EventProcessingBuilder.prototype.update = function(modelObjectType) {
        this._action = EventProcessingBuilder.UPDATE_PERSPECTIVE_ACTION;
        this._modelDefinition = this._container.getModelDefinition(modelObjectType);
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

    function EventProcessor(container, eventDefinition) {
        this._container = container;
        this._eventDefinition = eventDefinition;
    }
    EventProcessor.prototype.process = function(eventData, callback) {
        var event = this._wrap(eventData);
        this._container._eventStore.store(event, function(event){
            if (callback !== undefined) {
                callback(event.id());
            }
        });
        return event;
    }
    EventProcessor.prototype._wrap = function(eventData) {
        var storeFunction = this._eventDefinition.storeFunction();
        var dataToStore = storeFunction(eventData);
        var event = new Event(dataToStore);
        return event;
    }

/////////////////////////////////////////

/////////////////////////////////////////
//      ModelSelector
/////////////////////////////////////////

    function ModelSelector(container, modelDefinition, callback) {
        this._container = container;
        this._modelDefinition = modelDefinition;
        this._callback = callback;
    }
    ModelSelector.prototype.byId = function(id) {
        var thisObject = this;
        this._container._eventStore.get(id, function(initialEvent){
            //first event must be initial for this model
            var createFunction = thisObject._modelDefinition.createFunction();
            var model = createFunction();
            thisObject._container._eventStore.selectFrom(id, function(next){
                // then go through other events and filter out
                // events for which apply functions are defined
                for(var event = next(); event !== undefined; event = next()) {
                    var eventDefinition = thisObject._container.getEventDefinition(event.type());
                    var applyFunction = 
                        thisObject._modelDefinition.applyFunctions().get(eventDefinition.id());
                    var restoreFunction = eventDefinition.restoreFunction();
                    var data = restoreFunction(event.data());
                    applyFunction(model, event.id(), data);    
                }
                thisObject._callback(model);
            });
            
        });
        
    }
/////////////////////////////////////////

/////////////////////////////////////////
//      EventSelector
/////////////////////////////////////////
    function EventSelector(container, eventDefinition, callback) {
        this._container = container;
        this._eventDefinition = eventDefinition;
        this._callback = callback;
    }
    EventSelector.prototype.byId = function(id) {
        var thisObject = this;
        this._container._eventStore.get(id, function(event){
            var restoreFunction = thisObject._eventDefinition.restoreFunction();
            var data = event ? restoreFunction(event.data()) : undefined;
            thisObject._callback(data);
        });
    }
/////////////////////////////////////////

/////////////////////////////////////////
//      JSEE Container
/////////////////////////////////////////

    function Container() {
        this._events = new LinkedMap();
        this._models = new LinkedMap();
        this._eventStore = new InMemoryEventStore();
    } 
    
    Container.prototype = {
        Container : Container,
        InMemoryEventStore : InMemoryEventStore,
        Event: Event,
    };
    Container.prototype.event = function(objectType) {
        var dataType = convertToDataType(objectType);
        var eventDefinition = new EventDefinition(dataType);
        this._events.put(eventDefinition.id(), eventDefinition);
        return new EventDefinitionBuilder(this, eventDefinition);
    }
    Container.prototype.model = function(objectType) {
        var dataType = convertToDataType(objectType);
        var modelDefinition = new ModelDefinition(dataType);
        this._models.put(modelDefinition.id(), modelDefinition);
        return new ModelDefinitionBuilder(this, modelDefinition);
    }
    
    Container.prototype.when = function(objectType) {
        var dataType = convertToDataType(objectType);
        var eventDefinition = this.getEventDefinition(dataType);
        return new EventProcessingBuilder(this, eventDefinition);
    }
    
    Container.prototype.getEventDefinition = function(objectType) {
        var dataType = convertToDataType(objectType);
        var eventDefinition = 
            this._events.get(EventDefinition.toIdString(dataType));
        if (eventDefinition == undefined) {
            throw "Undefined event type: " + dataType;
        }
        return eventDefinition;
    }
    
    Container.prototype.getModelDefinition = function(objectType) {
        var dataType = convertToDataType(objectType);
        var modelDefinition = 
            this._models.get(ModelDefinition.toIdString(dataType));
        if (modelDefinition == undefined) {
            throw "Undefined model type: " + dataType;
        }
        return modelDefinition;
    }
    
    Container.prototype.findDefinition = function(objectType) {
        var dataType = convertToDataType(objectType);
        var definition = this._models.get(ModelDefinition.toIdString(dataType));
        if (definition !== undefined) {
            return definition;
        }
        definition = this._events.get(EventDefinition.toIdString(dataType));
        return definition;
    }
    
    Container.prototype.apply = function(eventData, callback) {
        var objectType = determineObjectType(eventData);
        var dataType = convertToDataType(objectType);
        var eventDefinition = this.getEventDefinition(dataType);
        
        var processor = new EventProcessor(this, eventDefinition);
        var event = processor.process(eventData, callback);
        return event.id();
    }
    Container.prototype.get = function(objectType, callback) {
        var definition = this.findDefinition(objectType);
        if (definition == undefined) {
            throw "Undefined object type: " + objectType;
        }
        if (!definition.isEvent()) {
            return new ModelSelector(this, definition, callback);            
        }
        return new EventSelector(this, definition, callback);
    }
    
/////////////////////////////////////////

    return new Container();
}

if (typeof JSEE_TEST == 'undefined') {
    JSEE = JSEE_MODULE(window, document);    
 
    
}



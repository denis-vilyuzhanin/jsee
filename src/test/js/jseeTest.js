
module('JSEE')


function OrderConfirmend(user, products) {
    this.user = user;
    this.products = products;
}

function ProductAdded(orderId, product) {
    this.orderId = orderId;
    this.product = product;
}
    
function Order(user, products, totalCost) {
    this.user = user;
    this.products = products;
    this.totalCost = totalCost;
}
    
var USER_NAME = "Fooman";
var PRODUCTS = [
        {
            title : "fooProduct1",
            price : 100
        },
        {
            title : "feeProduct2",
            price : 200
        }
];
var EXPECTED_TOTAL_COST = PRODUCTS[0].price + PRODUCTS[1].price;
    

test("Perspective create/update", function(){
    expect(5);
    JSEE.event(OrderConfirmend).restoreAs(function(json){
        return new OrderConfirmend(json.user, json.products);
    });
    JSEE.event(ProductAdded);
    JSEE.model(Order).create(function(){
        return new Order();    
    });
    
    JSEE.when(OrderConfirmend)
        .create(Order)
        .by(function(eventId, order){
            return id;
        })
        .as(function(order, eventId, orderConfirmed){
            order.user = orderConfirmed.user;
            order.products = orderConfirmed.products;
            var totalCost = 0;
            for(var i = 0; i < orderConfirmed.products.length; i++) {
                totalCost += orderConfirmed.products[i].price;
            } 
            order.totalCost = totalCost;
        });
    
    JSEE.when(ProductAdded)
        .update(Order)
        .by(function(event){
            return event.data().orderId;
        })
        .as(function(order, event){
            for(var i = 0; i < order.products.length; i++) {
                var product = order.products[i];
                if (product == event.data().product) {
                    order.products.splice(i, 1);
                    return;
                }
            }
            throw "Undefined product";
        });
    
    var orderConfirmedEvent = new OrderConfirmend(USER_NAME, PRODUCTS);
    var eventId = JSEE.apply(orderConfirmedEvent, function(eventId){
        JSEE.get(OrderConfirmend, function(storedEvent){
            equal(storedEvent.user, orderConfirmedEvent.user, "stored user");
            deepEqual(storedEvent.products, orderConfirmedEvent.products, "stored products");
            deepEqual(storedEvent, orderConfirmedEvent, "stored event");
        }).byId(eventId);
    });
    
    ok(eventId, "event ID");
    
    JSEE.get(Order, function(order){
        deepEqual(order, new Order(USER_NAME, PRODUCTS, EXPECTED_TOTAL_COST));    
    }).byId(eventId);
    
});



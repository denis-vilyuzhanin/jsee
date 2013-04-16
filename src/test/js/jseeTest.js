
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
    JSEE.event(OrderConfirmend);
    JSEE.event(ProductAdded);
    JSEE.model(Order).create(function(){
        return new Order();    
    });
    
    JSEE.when(OrderConfirmend)
        .create(Order)
        .by(function(event){
            return event.id();
        })
        .as(function(order, event){
            var totalCost = 0;
            for(var i = 0; i < event.data().products.length(); i++) {
                totalCost += event.data().products[i].price;
            } 
            return new Order(event.data().user, event.data().products, totalCost);
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
    
    
    var eventId = JSEE.send(new OrderConfirmend(USER_NAME, PRODUCTS), function(event){
        JSEE.get(function(storedEvent){
            deepEqual(event, storedEvent, "Event was stored");
        }).byId(event.id());
    });
    
    ok(eventId, "event ID");
    
    JSEE.get(Order, function(order){
        deepEqual(order, new Order(USER_NAME, PRODUCTS, EXPECTED_TOTAL_COST));    
    }).byId(id);
    
});



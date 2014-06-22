define("ScrollingElement", ["addJqueryPlugin", "toastmessage", "resize"],function(addJqueryPlugin) {
    /**
     * Глобальные настройки 
     */
    var settings = {
        element: $()
        , headHeight: 0
    };
    /**
     * Глобальные переменные и константы
     */ 
    var winEl = $(window);
    var htmlEl = $(document);
    var JQUERY_PLUGIN_NAME = "wpScrollingElement";
    /**
     * Конструктор ScrollingElement. В конструкторе определюятся все свойства объекта. 
     * Защищенные и приватные свойства называются начиная с символа подчеркивания
     * @constructor
     * @param {Object} options
     */
    function ScrollingElement (options) {
        $.extend(this, settings, options);
        
        this._elementId;
        this._columnEl;
        this._prevEl;
        this._winHeight;
        this._htmlHeight;      
        this._columnWidth;  
        this._columnHeight;
        this._elementHeight;
        this._columnTop;
        this._elementTop;
        this._columnPadding;
        this._elementBottom;
        this._winScroll;
        this._oldWinScroll;
        this._maxWinScroll;        
        this._minElementTopForDownWinScroll;
        this._limMinElementTopForDownWinScroll;
        this._limWinScrollForDownScroll;
        this._maxElementTopForUpWinScroll;
        this._limMaxElementTopForUpWinScroll;
        this._limWinScrollForUpScroll;
        
        this._init();
        
    }
    /**
     * Наследуемся от класса родителя и определяем методы. Защищенные и приватные методы называются начиная с символа подчеркивания
     */
    var methods = ScrollingElement.prototype = new Object();
    
    methods._proxy = function(name) {
        var obj = this;
        return this["proxy-" + name] = this["proxy-" + name] || function(event) {
            obj[name](event);
        };
    };
    
    methods._init = function () {
        if (this.element.length != 1) {
            console.error("jQuery объект должен содержать один элемент.");
            return;
        }
        if (this.element.attr("id") == undefined) {
            console.error("Элемент должен иметь идентификатор.");
            return;
        }
        if (parseInt(this.element.css("margin-top")) != 0) {
            console.error("Верхний отступ у элемента должен быть равен 0.");
            return;
        }
        if (parseInt(this.element.css("margin-bottom")) != 0) {
            console.error("Нижний отступ у элемента должен быть равен 0.");
            return;
        }
        if (this.element.css("position") != "static") {
            console.error("Позиция элемента должна быть статичной.", this.element.css("position"));
            return;
        }
        
        this._elementId = this.element.attr("id");
        this._columnEl = this.element.closest("td");
        this._prevEl = $("<div/>").insertAfter(this.element);
        
        this.refresh();
        
        winEl.off("scroll.ScrollingElement-" + this._elementId).on("scroll.ScrollingElement-" + this._elementId, this._proxy("onWinScroll"));
        winEl.off("resize.ScrollingElement-" + this._elementId).on("resize.ScrollingElement-" + this._elementId, this._proxy("onWinResize"));
        htmlEl.off("resize.ScrollingElement-" + this._elementId).on("resize.ScrollingElement-" + this._elementId, this._proxy("onWinResize"));
        this.element.off("resize.ScrollingElement-" + this._elementId).on("resize.ScrollingElement-" + this._elementId, this._proxy("onWinResize"));
        // фикс для случая, если колонка содержит не все элементы
        if (this._elementId == "fixed-column")
            $("#left-column").off("resize.ScrollingElement-" + this._elementId).on("resize.ScrollingElement-" + this._elementId, this._proxy("onWinResize"));
    };
    
    methods.refresh = function () {
        this.element.css("position", "static");
        this.element.css("top", "0px");
        this._columnEl.css("height", "auto");
        this._prevEl.css("height", "0px");
        
        this._winHeight = winEl.height();
        this._htmlHeight = htmlEl.height();      
        this._columnWidth = this._columnEl.width();  
        this._columnHeight = this._columnEl.height();
        this._elementHeight = this.element.height();
        this._columnTop = this._columnEl.offset().top;
        this._elementTop = this.element.offset().top;
        this._columnPadding = this._elementTop - this._columnTop - parseInt(this._columnEl.css("border-top-width")) - parseInt(this._columnEl.css("padding-top"));
        
        this._elementBottom = this._htmlHeight - this._elementTop - (this._columnHeight - this._columnPadding);
        //console.log(this._htmlHeight, this._elementTop, this._columnHeight, this._elementBottom);
        //console.log(this._columnTop, this._columnHeight, this._elementBottom  );
        
        this._winScroll = winEl.scrollTop();
        this._oldWinScroll = this._winScroll;
        this._maxWinScroll = this._htmlHeight - this._winHeight;
        
        this._minElementTopForDownWinScroll = this.headHeight;
        if (this.headHeight + this._elementHeight  > this._winHeight) {
            this._minElementTopForDownWinScroll = this._winHeight - this._elementHeight;
        }
        this._limMinElementTopForDownWinScroll = this.headHeight;
        if (this.headHeight + this._elementHeight + this._elementBottom > this._winHeight) {
            this._limMinElementTopForDownWinScroll = this._winHeight - this._elementBottom - this._elementHeight;
        }
        this._limWinScrollForDownScroll = this._maxWinScroll - Math.abs(this._limMinElementTopForDownWinScroll - this._minElementTopForDownWinScroll);
        //console.log(this._minElementTopForDownWinScroll, this._limMinElementTopForDownWinScroll, this._limWinScrollForDownScroll, this._maxWinScroll);
        //
        this._maxElementTopForUpWinScroll = this.headHeight;
        this._limMaxElementTopForUpWinScroll = this._elementTop;
        this._limWinScrollForUpScroll = this._limMaxElementTopForUpWinScroll - this._maxElementTopForUpWinScroll;
        //console.log(this._maxElementTopForUpWinScroll, this._limMaxElementTopForUpWinScroll, this._limWinScrollForUpScroll, this._maxWinScroll);
        //
        this.element.css("position", "fixed");
        this.element.css("top", this._elementTop + "px");
        this._columnEl.css("width", this._columnWidth + "px");
        this._columnEl.css("height", this._columnHeight + "px");
        this._prevEl.css("width", "1px")
        //this._prevEl.css("height", this._elementHeight + "px")
        this.changePosition(this._winScroll, this._winScroll);
    };
    
    methods.onWinResize = function (event) {
        this.refresh();
    };
    
    methods.changePosition = function(winScroll, shift) {
        if (this._maxWinScroll == 0) {
            return;
        }
        var top = parseInt(this.element.css("top")) - shift;
        if (shift >= 0) {            
            if (winScroll < this._limWinScrollForDownScroll || this._limWinScrollForDownScroll == this._maxWinScroll) {
                if (top < this._minElementTopForDownWinScroll) {
                    top = this._minElementTopForDownWinScroll;
                }                    
            } else {
                top = this._minElementTopForDownWinScroll - (winScroll - this._limWinScrollForDownScroll);
                
                if (top < this._limMinElementTopForDownWinScroll) {
                    top = this._limMinElementTopForDownWinScroll;
                }
            }
        } else {
            if (winScroll > this._limWinScrollForUpScroll) {
                if (top > this._maxElementTopForUpWinScroll) {
                    top = this._maxElementTopForUpWinScroll;
                }
            } else {
                top = this._maxElementTopForUpWinScroll - (winScroll - this._limWinScrollForUpScroll);
                
                if (top > this._limMaxElementTopForUpWinScroll) {
                    top = this._limMaxElementTopForUpWinScroll;
                }
            } 
        }  
        this.element.css("top", top + "px");
    };
    
    methods.onWinScroll = function () {
        this._winScroll = winEl.scrollTop();
        if (this._winScroll < 0) {
            this._winScroll = 0;
        }
        if (this._winScroll > this._maxWinScroll) {
            this._winScroll = this._maxWinScroll;
        }
        this.changePosition(this._winScroll, this._winScroll - this._oldWinScroll);
        this._oldWinScroll = this._winScroll;
    };
    
    methods.destroy = function() {
        winEl.off("scroll.ScrollingElement-" + this._elementId);
        
        this.element.css("position", "static");
        this.element.css("top", "0px");
        this._columnEl.css("width", "auto");
        this._columnEl.css("height", "auto");
        
        this.element.data(JQUERY_PLUGIN_NAME, undefined);
    };
    
    addJqueryPlugin(ScrollingElement, JQUERY_PLUGIN_NAME);
    
    return ScrollingElement;
});

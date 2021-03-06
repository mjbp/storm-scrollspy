import throttle from 'raf-throttle';

const isHidden = el => el.offsetParent === null,
      inView = el => {
          if (isHidden(el)) return false;
        
          let box = el.getBoundingClientRect();
          return (box.right >= 0 && box.bottom >= 0 && box.left <= (window.innerWidth || document.documentElement.clientWidth) && box.top <= (window.innerWidth || document.documentElement.clientWidth));
      }

let docHeight;

export default {
    init() {
        this.navItems = this.getNavItems();
        this.setPositions();
        this.sortNavItems();
        this.activeNavItem = this.navItems.filter(item => item.node.classList.contains(this.settings.activeClassName))[0] || null;
        this.setCurrentItem();
        this.initListeners();
        return this;
    },
    initListeners() {
        this.throttledScroll = throttle(this.setCurrentItem.bind(this));
        
        this.throttledResize = throttle(() => {
            this.setPositions();
            this.setCurrentItem();
        });

        window.addEventListener('scroll', this.throttledScroll, false);
        window.addEventListener('resize', this.throttledResize, false);
        this.observer = new MutationObserver(this.throttledResize);
        this.observer.observe(document.body, { attributes: true, childList: true, subtree: true });
    },
    getNavItems() {
        return this.DOMElements.map(item => {
            if (!item.hash || !document.querySelector(item.hash)) return null;
            
            return {
                node: item,
                target: document.querySelector(item.hash),
                parent: item.parentNode.tagName.toLowerCase() === 'li' ? item.parentNode : null,
                position: 0
            };
        });
    },
    setPositions() {
        let getOffsetTop = el => {
            let location = 0;
            if (el.offsetParent) {
                do {
                    location += el.offsetTop;
                    el = el.offsetParent;
                } while (el);
            } else {
                location = el.offsetTop;
            }
            location = location - this.settings.offset;
            return location >= 0 ? location : 0;
        };

        docHeight = Math.max(
            document.body.scrollHeight, document.documentElement.scrollHeight,
            document.body.offsetHeight, document.documentElement.offsetHeight,
            document.body.clientHeight, document.documentElement.clientHeight
        );
        this.navItems.forEach(item => {
            item.position = getOffsetTop(item.target);
        });
    },
    sortNavItems(){
        this.navItems.sort((a, b) => {
            if (a.position > b.position) return -1;
            if (a.position < b.position) return 1;
            return 0;
        });
    },
    setCurrentItem(){
        let position = window.pageYOffset;

        //at the bottom and in view, choose the last one
        if ((window.innerHeight + position) >= docHeight && !!inView(this.navItems[0].node) ) {
            this.toggle(this.navItems[0]);
            return this;
        }
        //find the next item
        for(var i = 0; i < this.navItems.length; i++){
            if(this.navItems[i].position <= position) {
                this.toggle(this.navItems[i]);
                return this;
            }
        }
        //nothing found
        this.toggle(null);
        (!!this.settings.callback && typeof this.settings.prehook === 'function') && this.settings.callback();
    },
    toggle(next){
        if(this.activeNavItem === next) return;

        if(this.activeNavItem) this.activeNavItem.node.classList.remove(this.settings.activeClassName);
        
        this.activeNavItem = next;
        if(!next) return;

        next.node.classList.add(this.settings.activeClassName);
    }
};
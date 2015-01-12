;(function() {
    'use strict'
    
    /*
     *TODO:
     *
     *make drawMap only draw VISIBLE tiles (ie ones within the current viewport)
     *
     *REst of the app.
     */
    
    //private fns
    function toNumber(str) {
        var match = str && typeof str.match == 'function' ? str.match(/[0-9]+/) : null
        return match ? +match[0] : match
    }
    
    //module vars
    var MAX_WIDTH = 200,
        MAX_HEIGHT = 200,
        MAX_Z = 10,
        IS_MOBILE = (function() {
            return 'ontouchstart' in window || 'onmsgesturechange' in window 
        })(),
        mainCanvas = document.querySelector('#main-portal > canvas'),
        mainCanvasStyles = window.getComputedStyle(mainCanvas.parentNode, null),
        mainCtx = mainCanvas.getContext('2d'),
        sheetCanvas = document.querySelector('#sheet-portal > canvas'),
        sheetCanvasStyles = window.getComputedStyle(sheetCanvas.parentNode),
        sheetCtx = sheetCanvas.getContext('2d'),
        
        //using greater for both dimensions avoids distortion of the canvas
        mainDimension = Math.max(toNumber(mainCanvasStyles.height),
                                 toNumber(mainCanvasStyles.width)),
        sheetDimension = Math.max(toNumber(sheetCanvasStyles.height),
                                  toNumber(sheetCanvasStyles.width)),
        
        //will need to frob files in the server-side dir for these, but for testing:
        currentFilePath = 'img/spritesheets/basictiles16x16.png',
        
        //likewise, this will be replaced by either an ajax call or template
        sheetFiles = [
            'img/spritesheets/basictiles16x16.png',
            'img/spritesheets/somegetsheet16x16.png',
            'img/spritesheets/thirdfile32x32.png'
        ],
        
        //try to strip tile dimensions from the filename if present, default to 16x16
        dimensions = (function(s) {
            var arr = s.toLowerCase().match(/[0-9]+x[0-9]+/),
                str = arr ? arr[0] : '16x16'
            
            return str.split('x').map(function(i){return +i})
        })(currentFilePath),
        
        tileWidth = dimensions[0],
        tileHeight = dimensions[1],
        
        //standard tile size
        normalizedX = IS_MOBILE ? 48 : 32,
        normalizedY = IS_MOBILE ? 48 : 32,
        
        //scaling factors to make tilesheets w/different base sizes compatible
        xFactor = normalizedX/tileWidth,
        yFactor = normalizedY/tileHeight,
        
        //need a clean copy of the sheet because of the guidelines, also for caching
        sheetCopy = document.createElement('canvas'),
        copyCtx = sheetCopy.getContext('2d'),
        
        //current x/y values for selected tile of the spritesheet
        currentX,
        currentY,
        currentZ = 0,
        
        edit = true,
        
        //img for the spritesheet
        img = document.createElement('img'),
        
        //now for the fun part, an array of arrays of arrays for x, y, z elements
        //btw, loops are for sissies
        layers = Array.apply(null, Array(MAX_HEIGHT)).map(function() {
            return Array.apply(null, Array(MAX_WIDTH)).map(function() {
                return Array.apply(null, Array(MAX_Z))
            })
        })
    
    
    //init configs
    
    //tool for mobile. We're doing this here rather than w/css media queries, because the main
    //concern is whether or not text will be a tap target TODO resize icons/menu, 2 big for desktop
    //if (IS_MOBILE) {
    //    [].slice.call(document.querySelectorAll('html, body')).forEach(function(node) {
    //        node.style.fontSize = '25px'
    //    })
    //}
    
    //set canvas dimensions
    mainCanvas.setAttribute('width', mainDimension) 
    mainCanvas.setAttribute('height', mainDimension) 
    sheetCanvas.setAttribute('width', sheetDimension)
    sheetCanvas.setAttribute('height', sheetDimension)
    sheetCopy.setAttribute('height', normalizedY * MAX_HEIGHT)
    sheetCopy.setAttribute('width', normalizedX * MAX_WIDTH)
    
    //draw the image onto the canvases, scaling appropriately
    img.onload = function() {
        sheetCtx.drawImage(this, 0, 0, this.width * xFactor, this.height * yFactor)
        copyCtx.drawImage(this, 0, 0, this.width * xFactor, this.height * yFactor)
    }
    img.src = currentFilePath
    
    //create li elements for list of spritesheet files
    sheetFiles.forEach(function(file, i) {
        var sheettxt = document.createElement('li');
        
        //style the first, default selected item
        if (!i) {
            sheettxt.classList.add('li-selected')
        }
        
        sheettxt.addEventListener('click', function(e) {
            //TODO - add code to actually load image
            
            [].slice.call(e.currentTarget.parentNode.children).forEach(function(li) {
                li == e.currentTarget ? e.currentTarget.classList.add('li-selected') :
                                        e.currentTarget.classList.remove('li-selected')
            })
        })
    
        //get just the filename from the currentFilePath dropping the ext as well
        sheettxt.innerHTML = file.split(/[\\\/]/).pop().split('.')[0]
        document.querySelector('#rt-bottom > ul').appendChild(sheettxt)
    })
    
    //added properties
    
    //offsets (in pixels) caused by using the scrolling arrows
    mainCanvas.editorXOffset = 0
    mainCanvas.editorYOffset = 0
    //sheetCanvas.editorXOffset = 0
    //sheetCanvas.editorYOffset = 0
    
    //methods
    
    /*
     *NOTE- for actual game use a 'loadMap' fn to precomposite tiles onto the spritesheet
     *and then the 'drawMap' fn can be two loops instead of 3
     */
    var next = document.createElement('canvas')
    next.width = mainCanvas.width
    next.height = mainCanvas.height
    mainCanvas.drawMap = function(layers, src, mode) {
        var y = 0, row, layer, arr, z, //ctx = this.getContext('2d')
        
        ctx = next.getContext('2d')
        for (;y < MAX_HEIGHT; y++) {
            row = layers[y]
            for (var x=0; x < MAX_WIDTH; x++) {
                arr = row[x]
                                        
                //draw only up to current z-level
                for (z=0;z<=currentZ; z++) {
                    layer = arr[z]
                    
                    if (layer && layer.length) {
                        
                        //if layer isn't the current one and edit mode, make semi-transparent
                        ctx.globalAlpha = (z != currentZ) && mode ? .5 : 1
                        
                        if (layer.length == 2) {
                            ctx.drawImage(src, layer[0], layer[1],
                                                        normalizedX,
                                                        normalizedY,
                                                        x * normalizedX,
                                                        y * normalizedY,
                                                        normalizedX,
                                                        normalizedY)
                        } else {
                            //fillRect w/fill color
                        }
                    }
                }
            }
        }
        this.getContext('2d').drawImage(next, 0, 0)
        
        //clear alt canvas
        next.width = next.width
        //reset globalAlpha to opaque in case last element was translucent
        ctx.globalAlpha = 1
        
        return this
    }
    
    mainCanvas.clear = function() {
        this.width = this.width
        return this
    }
    
    sheetCanvas.clear = function() {
        this.width = this.width
        return this
    }
    
    /**
     *returns x and y coords (in pixels, not tiles!) of top-left corner of the 'tile'
     *containing a mouse click on a canvas, meant to be bound to each canvas
     */
    sheetCanvas.getXY = function(x, y) {
        return [
            (x/normalizedX|0) * normalizedX, //+ this.editorXOffset,
            (y/normalizedY|0) * normalizedY //+ this.editorYOffset
        ]
    }
    
    /**
     *Draws grid-like guidelines over the spriteSheet
     */
    sheetCanvas.drawGrid = function(x, y) {
        var ctx = this.getContext('2d'),
            i = 0
            
        for (;i<this.width; i += x) {
            ctx.moveTo(i, 0)
            ctx.lineTo(i, this.height)
        }
        
        ctx.moveTo(0,0)
        i=0
        
        for (;i<this.height; i += y) {
            ctx.moveTo(0, i)
            ctx.lineTo(this.width, i)
        }
        
        ctx.strokeStyle = 'blue'
        ctx.stroke()
    }
    
    //draw the initial grid
    sheetCanvas.drawGrid(normalizedX, normalizedY)
    
    //event listeners
    
    sheetCanvas.addEventListener('click', function(e) {
        var arr = e.offsetY === undefined ?
                        this.getXY(e.layerX, e.layerY) :
                        this.getXY(e.offsetX, e.offsetY)
        
        currentX = arr[0]
        currentY = arr[1]
    })
    
    mainCanvas.addEventListener('click', function(e) {
        if (edit) {
            var arr = e.offsetY === undefined ?
                        [e.layerX/normalizedX|0, e.layerY/normalizedY|0] :
                        [e.offsetX/normalizedX|0, e.offsetY/normalizedY|0] 
            
            layers[arr[1]][arr[0]][currentZ] = [currentX, currentY]
            this.clear().drawMap(layers, sheetCopy, edit)
        }
    })
    
    //sheetArrows.forEach(function(arrow, i) {
    //    arrow.addEventListener('click', function(e) {
    //        
    //        //get the offset vals for the particular arrow button
    //        var arr = e.target.getAttribute('value').split(',')
    //        sheetCanvas.editorXOffset += +arr[0] * normalizedX
    //        sheetCanvas.editorYOffset += +arr[1] * normalizedY
    //        
    //        //clear the canvas
    //        sheetCanvas.clear()
    //        
    //        //draw image and grid
    //        sheetCtx.drawImage(sheetCopy, sheetCanvas.editorXOffset, sheetCanvas.editorYOffset,
    //                           img.width * xFactor, img.height * yFactor, 0, 0,
    //                           img.width * xFactor, img.height * yFactor)
    //        
    //        sheetCanvas.drawGrid(normalizedX, normalizedY)
    //    })
    //})
    
    document.getElementById('z-up').addEventListener('click', function() {
        currentZ = currentZ == MAX_Z - 1 ? MAX_Z - 1 : currentZ + 1
        mainCanvas.clear().drawMap(layers, sheetCopy, edit)
    })
    
    document.getElementById('z-down').addEventListener('click', function() {
        currentZ = currentZ ? currentZ - 1 : 0
        mainCanvas.clear().drawMap(layers, sheetCopy, edit)
    })
    
    document.getElementById('view-mode').addEventListener('click', function() {
        var menu = document.getElementById('main-menu'),
            icon = document.querySelector('body > img:first-of-type')
            
        edit = false
        mainCanvas.clear().drawMap(layers, sheetCopy, edit)
        menu.classList.remove('menu-animation-in')
        menu.classList.add('menu-animation-out')
        icon.classList.remove('icon-animation-out')
        icon.classList.add('icon-animation-in')
    })
    
    document.getElementById('edit-mode').addEventListener('click', function() {
        var menu = document.getElementById('main-menu'),
            icon = document.querySelector('body > img:first-of-type')
            
        edit = true
        mainCanvas.clear().drawMap(layers, sheetCopy, edit)
    })
    
    document.querySelector('body > img:first-of-type').addEventListener('click', function(e) {
        var menu = document.getElementById('main-menu')
        e.target.classList.remove('icon-animation-in')
        e.target.classList.add('icon-animation-out')
        menu.classList.remove('menu-animation-out')
        menu.classList.add('menu-animation-in')
    })
    
    document.getElementById('hide-menu').addEventListener('click', function(e) {
        var icon = document.querySelector('body > img:first-of-type')
        e.target.parentNode.classList.remove('menu-animation-in')
        e.target.parentNode.classList.add('menu-animation-out')
        icon.classList.remove('icon-animation-out')
        icon.classList.add('icon-animation-in')
    })
    
})()

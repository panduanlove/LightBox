(function($){
    var LightBox=function(){
        var self=this;
        //创建遮罩和弹出框
        this.popupMask=$('<div id="G-lightbox-mask"></div>');
        this.popupWin=$('<div id="G-lightbox-popup"></div>');
        //保存BODY
        this.bodyNode=$(document.body);
        //渲染剩余的DOM，并且插入到BODY
        this.renderDOM();
        this.picViewArea=this.popupWin.find("div.lightbox-pic-view");       //图片预览区域
        this.popupPic     =this.popupWin.find("img.lightbox-image");               //图片区域
        this.picCaptionArea=this.popupWin.find("div.lightbox-pic-caption");     //图片描述区域
        this.nextBtn    =this.popupWin.find("span.lightbox-next-btn");
        this.prevBtn    =this.popupWin.find("span.lightbox-prev-btn");
        this.captionText=this.popupWin.find("p.lightbox-pic-desc");            //图片描述
        this.currentIndex=this.popupWin.find("span.lightbox-of-index");        //图片索引
        this.closeBtn   =this.popupWin.find("span.lightbox-close-btn");        //关闭按钮

        //准备开发事件委托，获取组数据，如果不委托给body，后续加载出来的图片还要在绑定事件
        this.groupName=null;
        this.groupData=[];           //放置同一组数据
        this.bodyNode.delegate("*[data-role=lightbox]","click",function(e){
            //阻止事件冒泡
            self.stopBubble(e);
            var currentGroupName=$(this).attr("data-group");
            if(currentGroupName!=self.groupName){
                self.groupName=currentGroupName;
                //根据当前组名获取同一组数据
                self.getGroup();
            }

            //初始化弹框
            self.initPopup($(this));

        });
        this.popupMask.click(function(){
            $(this).fadeOut();
            self.popupWin.fadeOut();
        });
        this.closeBtn.click(function(){
            self.popupMask.fadeOut();
            self.popupWin.fadeOut();
        });
        //绑定上下切换按钮事件
        this.nextBtn.hover(function(){
            if(!$(this).hasClass("disabled")&&self.groupData.length>1){
                $(this).addClass("lightbox-next-btn-show");
                $(this).css("cursor","pointer")
            }
        },function(){
            $(this).removeClass("lightbox-next-btn-show");
        }).click(function(e){
            if(!$(this).hasClass("disabled")){
                self.stopBubble(e);
                self.goto("next");
            }
        });
        this.prevBtn.hover(function(){
            if(!$(this).hasClass("disabled")&&self.groupData.length>1){
                $(this).addClass("lightbox-prev-btn-show");
                $(this).css("cursor","pointer")
            }
        },function(){
            $(this).removeClass("lightbox-prev-btn-show");
        }).click(function(e){
            if(!$(this).hasClass("disabled")){
                self.stopBubble(e);
                self.goto("prev");
            }
        });
    }
    LightBox.prototype.renderDOM= function(){
            var strDom='<div class="lightbox-pic-view">'+
            '<span class="lightbox-btn lightbox-prev-btn"></span>'+
            '<img class="lightbox-image" src=""/>'+
            '<span class="lightbox-btn lightbox-next-btn"></span>'+
            '</div>'+
            '<div class="lightbox-pic-caption">'+
            '<div class="lightbox-caption-area">'+
            '<p class="lightbox-pic-desc">ppppppp</p>'+
            '<span class="lightbox-of-index">当前索引：0 of 0</span>'+
            '</div>'+
            '<span class="lightbox-close-btn"></span>'+
            '</div>';
            //插入到this.popupWin
            this.popupWin.html(strDom);
            //把遮罩和弹出框插入到body对象
            this.bodyNode.append(this.popupMask,this.popupWin);
        }
    LightBox.prototype.getGroup=function(){
        var self=this;
        //每次都先清空数组数据再获取，要不会把获取的数据追加到上一个组的数据后面
        this.groupData=[];
        //根据当前的组别名称获取页面中所有相同组别的对象
        var groupList=this.bodyNode.find("*[data-group="+this.groupName+"]");
        groupList.each(function(){
            self.groupData.push({
                src:$(this).attr("data-source"),
                id:$(this).attr("data-id"),
                caption:$(this).attr("data-caption")
            });
        });

    }
    LightBox.prototype.initPopup=function(currentObj){
        var self      =  this,
            sourceSrc  = currentObj.attr("data-source"),
            currentId  =currentObj.attr("data-id");
        this.showMaskAndPopup(sourceSrc,currentId);

    }
    LightBox.prototype.showMaskAndPopup=function(sourceSrc,currentId){
        var self=this;
        this.popupPic.hide();
        this.picCaptionArea.hide();
        this.popupMask.fadeIn();
        var winWidth=$(window).width();
        var winHeight=$(window).height();
        this.picViewArea.css({
            "width":winWidth/2,
            "height":winHeight/2
        });
        this.popupWin.fadeIn();
        var viewHeight=winHeight/2+10;
        this.popupWin.css({
            "width":winWidth/2+10,
            "height":viewHeight,
            "marginLeft":-(winWidth/2+10)/2,
            "top":-viewHeight
        }).animate({
            "top":(winHeight-viewHeight)/2
        },function(){
            //加载弹出的图片
            self.loadPicSize(sourceSrc);
        });
        //根据当前点击的元素id获取在当前组别里面的索引
        this.index=this.getIndexOf(currentId);

        //判断是否显示左右切换图片的按钮
        var groupDataLength=this.groupData.length;
        //如果组里面只有一张图片就不操作
        if(groupDataLength>1){
            if(this.index===1){
                this.prevBtn.addClass("disabled");
                this.nextBtn.removeClass("disabled");
            }else if(this.index===groupDataLength){
                this.nextBtn.addClass("disabled");
                this.prevBtn.removeClass("disabled");
            }else{
                this.nextBtn.removeClass("disabled");
                this.prevBtn.removeClass("disabled");
            }
        }
    }
    LightBox.prototype.getIndexOf=function(currentId){
        var index=0;
        $(this.groupData).each(function(){
            index++;
            if(this.id===currentId){
                return false;       //当找到对应id时，退出each循环
            }
        });
        return index;
    }
    LightBox.prototype.loadPicSize=function(sourceSrc){
        var self=this;
        //每次加载图片前，先设置宽高auto，否则下次加载的图片跟上次宽高一样
        self.popupPic.css({"width":"auto","height":"auto"}).hide();

        //预加载图片方法
        this.preLoadImg(sourceSrc,function(){
            self.popupPic.attr("src",sourceSrc);
            var picWidth=self.popupPic.width();
            var picHeight=self.popupPic.height();
            self.changePic(picWidth,picHeight);
        });
    }
    //监控图片是否加载完成,完成就执行回调函数
    LightBox.prototype.preLoadImg=function(src,callback){
        var img=new Image();
        if(window.ActiveXObject){     //IE浏览器
            img.onreadystatechange=function(){
                if(this.readyState=="complete"){
                    callback();
                }
            }
        }else{                          //其他浏览器
            img.onload=function(){
                callback();
            }
        }
        img.src=src;
    }
    LightBox.prototype.changePic=function(width,height){
        var self=this;
        var winWidth=$(window).width();
        var winHeight=$(window).height();
        //如果图片的宽高大于浏览器视口的宽高比，就要看下图片是否溢出
        var scale=Math.min(winWidth/(width+10),winHeight/(height+10),1);
        width=width*scale;
        height=height*scale;
        this.picViewArea.animate({
            "width":width-10,
            "height":height-10
        });
        this.popupWin.animate({
            "width":width,
            "height":height,
            "marginLeft":-(width/2),
            "top":(winHeight-height)/2
        },function(){
            self.popupPic.css({
                "width":width-10,
                "height":height-10
            }).fadeIn();
            self.picCaptionArea.fadeIn();
        });
        //设置描述文字和当前索引
        this.captionText.text(this.groupData[this.index-1].caption);
        this.currentIndex.text("当前索引："+this.index+" of "+this.groupData.length);
    }
    //上下切换图片的方法
    LightBox.prototype.goto=function(dir){
        if(dir==="next"){
            this.index++;
            if(this.index>=this.groupData.length){
                this.nextBtn.addClass("disabled").removeClass("lightbox-next-btn-show");
            }
            if(this.index!==1){
                this.prevBtn.removeClass("disabled");
            }
        }else if(dir==="prev"){
            this.index--;
            if(this.index===1){
                this.prevBtn.addClass("disabled").removeClass("lightbox-prev-btn-show");
            }
            if(this.index<=this.groupData.length){
                this.nextBtn.removeClass("disabled");
            }
        }
        var src=this.groupData[this.index-1].src;
        this.loadPicSize(src);
    }
    LightBox.prototype.stopBubble=function(e){
        if(e.cancelBubble){     //IE浏览器
            e.cancelBubble=true;
        }else{                  //其他浏览器
            e.stopPropagation();
        }
    }
    window["LightBox"]=LightBox;
})(jQuery);
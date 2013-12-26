
var __CTRIP_JS_PARAM = "?jsparam="
var __CTRIP_URL_PLUGIN = "ctrip://h5/plugin" + __CTRIP_JS_PARAM;

var kCallbackReturnName = 100;

/**
* @class Internal
* @description bridge.js内部使用的工具类
* @private
*/ 
var Internal = {
    /**
     * @description  bridge.js内部使用，判断是否是iOS
     * @type Bool
     * @property isIOS
     */
    isIOS:true,

    /**
     * @description  bridge.js内部使用，判断是否是Android设备
     * @type Bool
     * @property isAndroid
     */
    isAndroid:true,

    /**
     * @description bridge.js内部使用，存储当前携程旅行App版本
     * @type String
     * @property appVersion
     */     
    appVersion:"",

    /**
     * @description 判断当前版本号是否大于传入的版本号
     * @param {String} verStr 版本号
     * @method isAppVersionGreatThan
     * @return {Bool} 是否大于该版本号
     * @since v5.2
     * @example
     * var isLarger = isAppVersionGreatThan(5.2); <br />
     * alert(isLarger); // depends
     */
    isAppVersionGreatThan:function(verStr) {
        if ((typeof verStr == "string") && (verStr.length > 0)) {
            var inVer = parseFloat(verStr);
            var nowVer = parseFloat(Internal.appVersion);
            if (nowVer - inVer >= 0) {
                return true;
            }
        }

        return false;
    },

   /**
     * @description 回调H5页面，告知API开始支持的版本号及当前App的版本
     * @param {String} supportVer API支持的版本号
     * @method appVersionNotSupportCallback
     * @since v5.2
     * @author jimzhao
     */
    appVersionNotSupportCallback:function(supportVer) {
        var jsonObj = {"tagname":"app_version_too_low","start_version":supportVer,"app_version":Internal.appVersion};
        CtripTool.app_log(JSON.stringify(jsonObj));
        window.app.callback(jsonObj);
    },

    /**
     * @description 回调H5页面，所调用的JS 参数有错误
     * @param {String} description 错误原因描述
     * @method paramErrorCallback
     * @since v5.2
     * @author jimzhao
     */
    paramErrorCallback:function(description) {
        var jsonObj = {"tagname":"app_param_error","description":description};
        CtripTool.app_log(JSON.stringify(jsonObj));
        window.app.callback(jsonObj);
    },

   /**
     * @description 判断字符串是否为空
     * @method isNotEmptyString
     * @param {String} str 需要判断的字符串
     * @since v5.2
     */
    isNotEmptyString:function(str) {
        if ((typeof str == "string") && (str.length > 0)) {
            return true;
        }

        return false;
    },


   /**
     * @description 内部隐藏iframe，做URL跳转
     * @method loadURL
     * @param {String} url 需要跳转的链接
     * @since v5.2
     */
    loadURL:function(url) {
        var iframe = document.createElement("iframe");
        var cont = document.body || document.documentElement;

        iframe.style.display = "none";
        iframe.setAttribute('src', url);
        cont.appendChild(iframe);

        setTimeout(function(){
            iframe.parentNode.removeChild(iframe);
            iframe = null;
        }, 200);
    },

   /**
     * @description  内部使用，组装URL参数
     * @return 返回序列化之后的字符串
     * @method makeParamString
     * @param {String} service app响应的plugin的名字
     * @param {String} action 该plugin响应的函数
     * @param {JSON} param 扩展参数，json对象
     * @param {String} callbackTag app回调给H5页面的tagname
     * @since v5.2
     */
    makeParamString:function(service, action, param, callbackTag) {

        if (!Internal.isNotEmptyString(service) || !Internal.isNotEmptyString(action)) {
            return "";
        }

        if (!param) {
            param = {};
        };

        param.service = service;
        param.action = action;
        param.callback_tagname = callbackTag;

        return JSON.stringify(param);
    },

    /** 
     * @description  内部使用，组装URL
     * @return {String} encode之后的URL
     * @method makeURLWithParam
     * @param {String} paramString 拼接URL参数
     * @since v5.2
     */
    makeURLWithParam:function(paramString) {
        if (paramString == null) {
            paramString = "";
        }

        paramString = encodeURIComponent(paramString);

        return  __CTRIP_URL_PLUGIN + paramString;
    }
};

/**
 * @description 将native的callback数据转换给H5页面的app.callback(JSON)
 * @method __bridge_callback
 * @param {Number} param native传给H5的字符串,该字符串在app组装的时候做过URLEncode
 * @since v5.2
 * @author jimzhao
 */
function __bridge_callback(param) {
    param = decodeURIComponent(param);
    var jsonObj = JSON.parse(param);

    if (jsonObj != null) {
        if (jsonObj.param != null && jsonObj.param.hasOwnProperty("platform")) {
            platform = jsonObj.param.platform;
            Internal.isIOS = (platform == 1);
            Internal.isAndroid = (platform == 2);
            Internal.appVersion = jsonObj.param.version;
        }

        var retValue = window.app.callback(jsonObj);
        if (retValue) {
            // alert("window.app.callback > 0"+retValue);
            return retValue;
        };

        return kCallbackReturnName;
    }

    return -1;
};

/**
 * @description 写key/value数据到H5页面的local storage
 * @method __writeLocalStorage
 * @param {String} key 需要写入数据库的key
 * @param {String} value 需要写入数据库的value
 * @since v5.2
 * @author jimzhao
 */
function __writeLocalStorage(key, jsonValue) {
    if (Internal.isNotEmptyString(key)) {
        localStorage.setItem(key, jsonValue);
    }
};

/**
 * @class CtripTool
 * @description 工具类
 */
var CtripTool = {

    /**
     * @description 将log写入到native的日志界面
     * @method app_log
     * @param {String} log 需要打印打log
     * @param {String} result 上一句log执行的结果，可以为空,打印的时候会自动换行，加入时间
     * @since v5.2
     * @author jimzhao
     * @example CtripTool.app_log("execute script xxxxx", "result for script is oooooo");
     */
    app_log:function(log, result) {
        if (!Internal.isNotEmptyString(log)) {
            return;
        }
        if (!Internal.isNotEmptyString(result)) {
            result = "";
        }
        var params = {};
        params.log = log;
        params.result = result;
        paramString = Internal.makeParamString("Util", "h5Log", params, "log");
        if (Internal.isIOS) {
            url = Internal.makeURLWithParam(paramString);
            Internal.loadURL(url);
        }
        else {
            window.Util_a.h5Log(paramString);
        }
    }
};

/**
 * @class CtripUtil
 * @description 常用Util
 */
var CtripUtil = {

    /**
     * @description Native收集用户行为,该日志会被上传
     * H5页面调用该函数，需要将增加的event_name告知native，native需要整理纪录
     * @method app_log_event
     * @param {String} event_name 需要纪录的事件名
     * @since v5.2
     * @author jimzhao
     * @example Util.app_log_event('GoodDay')
     */
    app_log_event:function(event_name) {
        if (Internal.isNotEmptyString(event_name)) {
            var params = {};
            params.event = event_name;
            paramString =  Internal.makeParamString("Util", "logEvent", params, "log_event");

            if (Internal.isIOS) {
                url = Internal.makeURLWithParam(paramString);
                Internal.loadURL(url);
            }
            else if (Internal.isAndroid) {
                window.Util_a.logEvent(paramString);
            }
        }
    },


    /**
     * @description 进入H5模块，初始化数据
     * H5接收到web_view_did_finished_load的回调之后，调用该函数，初始化数据会通过callback传递给H5
     * @method app_init_member_H5_info
     * @since version 5.2
     * @author jimzhao
     * @callback tagname="init_member_H5_info"
     * @example
     CtripUtil.app_init_member_H5_info();
     //调用完成，H5页面会收到如下返回数据
     var json_obj =
     {
        tagname:"init_member_H5_info",
        timestamp:135333222,
        version:"5.2",
        device:"iPhone4S",
        appId:"com.ctrip.wrieless",
        serverVersion:"5.3",
        platform:1, //区分平台，iPhone为1, Android为2
        userInfo={USERINFO},//USERINFO内部结构参考CtripUser.app_member_login();    
     }
     app.callback(json_obj);
     */
    app_init_member_H5_info:function() {
        paramString = Internal.makeParamString("User", "initMemberH5Info", null, "init_member_H5_info");
        if (Internal.isIOS) {
            url = Internal.makeURLWithParam(paramString);
            Internal.loadURL(url);
        }
        else if(Internal.isAndroid) {
            window.User_a.initMemberH5Info(paramString);
        }
    },

    /**
     * @description 拨打电话
     * @param {String} phone 需要拨打的电话号码，为空时候，会拨打ctrip呼叫中心号码
     * @method app_call_phone
     * @since v5.2
     * @author jimzhao
     * @example CtripUtil.app_call_phone("13800138000");
     //或者直接拨打呼叫中心
     CtripUtil.app_call_phone();
     */
    app_call_phone:function(phone) {
        var params = {};
        params.phone = phone;

        paramString = Internal.makeParamString("Util", "callPhone", params, "call_phone")
        if (Internal.isIOS) {
            url = Internal.makeURLWithParam(paramString);
            Internal.loadURL(url);
        }
        else if (Internal.isAndroid){
            window.Util_a.callPhone(paramString);
        }
    },

    /**
     * @description 退回到首页，离开H5
     * @since v5.2
     * @method app_back_to_home
     * @author jimzhao
     * @example CtripUtil.app_back_to_home();
     */
    app_back_to_home:function() {
        paramString = Internal.makeParamString("Util", "backToHome", null, "back_to_home");
        if (Internal.isIOS) {
            url = Internal.makeURLWithParam(paramString);
            Internal.loadURL(url);
        }
        else if (Internal.isAndroid) {
            window.Util_a.backToHome(paramString);
        }
    },

    /**
     * @description 退回到H5页面的上一个页面，离开H5. v5.3开始支持带参数给上一个H5页面
     * @method app_back_to_last_page
     * @param {String} callbackString 离开H5页面，需要传递给上一个H5页面的数据，上一个H5页面在web_view_did_appear回调里面将会收到该数据
     * @since v5.2
     * @author jimzhao
     * @example CtripUtil.app_back_to_last_page("This is a json string for my previous H5 page");
     */
    app_back_to_last_page:function(callbackString) {
        var params = {};
        params.callbackString = callbackString;

        paramString = Internal.makeParamString("Util", "backToLast", params, "back_to_last_page");

        if (Internal.isIOS) {
            url = Internal.makeURLWithParam(paramString);
            Internal.loadURL(url);
        }
        else if (Internal.isAndroid) {
            window.Util_a.backToLast(paramString);
        }
    },

    /**
     * @description 定位
     * @param {Bool} is_async, true标识是异步定位，false标识为同步定位
     * @method app_locate
     * @callback tagname="locate"
     * @example
        CtripUtil.app_locate(true);
        //定位完成后H5页面会收到回调数据
        var json_obj =
        {
            tagname:'locate',
            param:{
                "value":{
                    ctyName: '上海',
                    addrs:'上海市浦东南路22号',
                    lat:'121.487899',
                    lng:'31.249162'
                },
                'timeout': '2013/09/12 12:32:36',
                'locateStatus':0,//iOS新增字段:-1网络不通，当前无法定位,-2定位没有开启
            }
        }
        app.callback(json_obj);
     * 
     */
    app_locate:function(is_async) {
        var params = {};
        params.is_async = is_async;

        paramString = Internal.makeParamString("Locate", "locate", params, 'locate')
        if (Internal.isIOS) {
            url = Internal.makeURLWithParam(paramString);
            Internal.loadURL(url);
        }
        else if (Internal.isAndroid) {
            window.Locate_a.locate(paramString);
        }
    },

    /**
     * @description 刷新顶部条按钮和文字
     * @param (String) nav_bar_config_json 顶部条配置json串
     * @method app_refresh_nav_bar
     * @author jimzhao
     * @since v5.2
     * @example
        //导航栏总共分为3部分，1.左侧，返回按钮，不能修改; 2. 中间title，可以任意设置; 3.右侧按钮，定义格式为{tagname:"xxxx",value:"btn_title"}
        var nav_json = {
            "center": [{"tagname": "title", "value":"携程" }],
            "right": [{"tagname": "click_tag_name", "value":"Click"}]
        }
        var json_str = JSON.stringify(nav_json);
        CtripUtil.app_refresh_nav_bar(json_str);

        //调用完成，顶部条title为携程，右侧有一个按钮，按钮文字为Click，用户点击按钮后，H5页面会收到如下回调
        var cb_json = {tagname:"click_tag_name"};
        app.callback(cb_json);
        //H5页面需要处理tagname为click_tag_name的事件
     */
    app_refresh_nav_bar:function(nav_bar_config_json) {
        if (Internal.isNotEmptyString(nav_bar_config_json)) {
            jsonObj = JSON.parse(nav_bar_config_json);

            jsonObj.service = "NavBar";
            jsonObj.action = "refresh";
            jsonObj.callback_tagname = "refresh_nav_bar";

            paramString = JSON.stringify(jsonObj);
            if (Internal.isIOS) {
                url = Internal.makeURLWithParam(paramString);
                Internal.loadURL(url);
            }
            else if (Internal.isAndroid) {
                window.NavBar_a.refresh(paramString);
            }
        }
    },

    /**
     * @description 打开链接URL地址
     * @param {String} openUrl 需要打开的URL，可以为ctrip://,http(s)://,file://等协议的URL
     * @param {int} targetMode 0,当前页面刷新url;1,系统浏览器打开,ctrip://协议需使用该mode;2,开启新的H5页面，title生效;
     * @param {String} title 当targetMode＝2时候，新打开的H5页面的title
     * @method app_open_url
     * @since v5.2
     * @author jimzhao
     * @example 
     //当前H5页面打开ctrip.com
     CtripUtil.app_open_url("http://www.ctrip.com", 0);
     //进入App的酒店详情页
     CtripUtil.app_open_url("ctrip://wireless/hotel?id=1234", 1);
     //开启新的H5页面，进入m.ctrip.com
     CtripUtil.app_open_url("http://m.ctrip.com", 2, "Ctrip H5首页");
     */
    app_open_url:function(openUrl, targetMode, title) {
        var params = {};
        params.openUrl = openUrl;
        params.title = title;
        params.targetMode = targetMode;

        paramString = Internal.makeParamString("Util", "openUrl", params, "open_url");
        if (Internal.isIOS) {
            url = Internal.makeURLWithParam(paramString);
            Internal.loadURL(url);
        }
        else if (Internal.isAndroid) {
            window.Util_a.openUrl(paramString);
        }
    },

    /**
     * @description 检查App的版本更新
     * @since v5.2
     * @method app_check_update
     * @author jimzhao
     * @example CtripUtil.app_check_update();
     */
    app_check_update:function() {
        paramString = Internal.makeParamString("Util", "checkUpdate", null, "check_update");
        if (Internal.isIOS) {
            url = Internal.makeURLWithParam(paramString);
            Internal.loadURL(url);
        }
        else if (Internal.isAndroid) {
            window.Util_a.checkUpdate(paramString);
        }
    },

    /**
     * @description 推荐携程旅行给好友
     * @since v5.2
     * @method app_recommend_app_to_friends
     * @author jimzhao
     * @example CtripUtil.app_recommend_app_to_friends();
     */
    app_recommend_app_to_friends:function() {
        paramString = Internal.makeParamString("Util", "recommendAppToFriends", null, "recommend_app_to_friends");
        if (Internal.isIOS) {
            url = Internal.makeURLWithParam(paramString);
            Internal.loadURL(url);
        }
        else if (Internal.isAndroid) {
            window.Util_a.recommendAppToFriends(paramString);
        }
    },

    /**
     * @description 添加微信好友
     * @since v5.2
     * @method app_add_weixin_friend
     * @author jimzhao
     * @example CtripUtil.app_add_weixin_friend();
     */
    app_add_weixin_friend:function() {
        paramString = Internal.makeParamString("Util", "addWeixinFriend", null, "add_weixin_friend");
        if (Internal.isIOS) {
            url = Internal.makeURLWithParam(paramString);
            Internal.loadURL(url);
        }
        else if (Internal.isAndroid) {
            window.Util_a.addWeixinFriend(paramString);
        }
    },

    /**
     * @description H5跨模块/站点跳转
     * @param {String} path 模块名称，如hotel, car, myctrip,
     * @param {String} param 作为URL，拼接在path后面的页面和其它参数 index.html#cashcouponindex?cash=xxxx
     * @method app_cross_package_href
     * @since v5.2
     * @author jimzhao
     * @example
      //跳转到我的携程首页
      CtripUtil.app_cross_package_href("myctrip", "index.html?ver=5.2"); 
     */
    app_cross_package_href:function(path, param) {
        var params = {};
        params.path = path;
        params.param = param;

        paramString = Internal.makeParamString("Util", "crossPackageJumpUrl", params, "cross_package_href");
        if (Internal.isIOS) {
            url = Internal.makeURLWithParam(paramString);
            Internal.loadURL(url);
        }
        else if (Internal.isAndroid) {
            window.Util_a.crossPackageJumpUrl(paramString);
        }
    },

    /**
     * @description 查看最新版本功能介绍
     * @since v5.2
     * @method app_show_newest_introduction
     * @author jimzhao
     * @example CtripUtil.app_show_newest_introduction();
     */
    app_show_newest_introduction:function() {
        paramString = Internal.makeParamString("Util", "showNewestIntroduction", null, "show_newest_introduction");
        if (Internal.isIOS) {
            url = Internal.makeURLWithParam(paramString);
            Internal.loadURL(url);
        }
        else if (Internal.isAndroid) {
            window.Util_a.showNewestIntroduction(paramString);
        }
    },

    /**
     * @description 检查当前App网络状况
     * @since v5.2
     * @method app_check_network_status
     * @author jimzhao
     * @example 
     CtripUtil.app_check_network_status();
     //调用完成后，H5页面会收到如下回调数据
     var json_obj = 
     {
        tagname:"check_network_status",
        hasNetwork:true,//布尔值返回是否有网络
     }
     app.callback(json_obj);
     */
    app_check_network_status:function() {
        paramString = Internal.makeParamString("Util", "checkNetworkStatus", null, "check_network_status");
        if (Internal.isIOS) {
            url = Internal.makeURLWithParam(paramString);
            Internal.loadURL(url);
        }
        else if (Internal.isAndroid) {
            window.Util_a.checkNetworkStatus(paramString);
        }
    },

    /**
     * @description 检查是否安装App
     * @param {String} openUrl 尝试打开的URL，iOS使用
     * @param {String} packageName app的包名，android使用
     * @method app_check_app_install_status
     * @since v5.2
     * @author jimzhao
     * @example 
     CtripUtil.app_check_app_install_status("ctrip://wireless", "com.ctrip.view");
     //调用完成后，H5页面会收到如下回调数据
     var json_obj = 
     {
        tagname:"check_app_install_status",
        isInstalledApp:true,//布尔值返回是否有安装
     }
     app.callback(json_obj);
     */
    app_check_app_install_status:function(openUrl, packageName) {
        var params = {};
        params.openUrl = openUrl;
        params.packageName = packageName;

        paramString = Internal.makeParamString("Util", "checkAppInstallStatus", params, "check_app_install_status");
        if (Internal.isIOS) {
            url = Internal.makeURLWithParam(paramString);
            Internal.loadURL(url);
        }
        else if (Internal.isAndroid) {
            window.Util_a.checkAppInstallStatus(paramString);
        }
    },

    /**
     * @description H5通知Native刷新
     * @param {String} pageName 要刷新的页面名字,该字段需要H5和native共同约定，H5调用之后，native需要捕获该名字的boardcast/notification
     * @param {String} jsonStr 刷新该页面需要的参数
     * @method app_refresh_native_page
     * @since v5.2
     * @author jimzhao
     * @example CtripUtil.app_refresh_native_page("xxxxPageName", "xxxx_json_string");
     */
    app_refresh_native_page:function(pageName, jsonStr) {
        var params = {};
        params.pageName = pageName;
        params.jsonStr = jsonStr;

        paramString = Internal.makeParamString("Util", "refreshNativePage", params, "refresh_native_page");
        if(Internal.isIOS) {
            url = Internal.makeURLWithParam(paramString);
            Internal.loadURL(url);
        }
        else if (Internal.isAndroid) {
            window.Util_a.refreshNativePage(paramString);
        }
    },

    /**
     * @description 复制文字到粘贴板
     * @param {String} toCopyStr, 需要复制的文字
     * @method app_copy_string_to_clipboard
     * @since v5.3
     * @author jimzhao
     * @example CtripUtil.app_copy_string_to_clipboard("words_to_be_copy_xxxxxx");
     */
    app_copy_string_to_clipboard:function(toCopyStr) {
        var startVersion = "5.3";
        if (!Internal.isAppVersionGreatThan(startVersion)) {
            Internal.appVersionNotSupportCallback(startVersion);
            return;
        }
        var params = {};
        params.copyString = toCopyStr;

        paramString = Internal.makeParamString("Util", "copyToClipboard", params, "copy_string_to_clipboard");
        if (Internal.isIOS) {
            url = Internal.makeURLWithParam(paramString);
            Internal.loadURL(url);
        }
        else if (Internal.isAndroid) {
            window.Util_a.copyToClipboard(paramString);
        }
    },

    /**
     * @description 从粘贴板读取复制的文字
     * @callback tagname="read_copied_string_from_clipboard";//返回当前粘贴板中的文字key=copiedString
     * @method app_read_copied_string_from_clipboard
     * @since v5.3
     * @author jimzhao
     * @example 
        Ctrip.app_read_copied_string_from_clipboard();
        //调用该函数之后，H5会收到如下回调
        var json_obj = 
        {
            tagname:"read_copied_string_from_clipboard",
            copiedString:"words_copied_xxxxxx";
        }
        app.callback(json_obj);
     */
    app_read_copied_string_from_clipboard:function() {
        var startVersion = "5.3";
        if (!Internal.isAppVersionGreatThan(startVersion)) {
            Internal.appVersionNotSupportCallback(startVersion);
            return;
        }

        paramString = Internal.makeParamString("Util", "readCopiedStringFromClipboard", null, "read_copied_string_from_clipboard");
        if (Internal.isIOS) {
            url = Internal.makeURLWithParam(paramString);
            Internal.loadURL(url);
        }
        else if (Internal.isAndroid) {
            window.Util_a.readCopiedStringFromClipboard(paramString);
        }
    },

    /**
     * @description 调用系统的分享
     * @param {String} image_relative_path 将要分享的图片相对路径，相对webapp的路径
     * @param {String} text 需要分享的文字
     * @method app_call_system_share
     * @since v5.3
     * @author jimzhao
     * @example CtripUtil.app_call_system_share("../wb_cache/pkg_name/md5_url_hash", "share to sina weibo");
     */
    app_call_system_share:function(image_relative_path, text) {
        var startVersion = "5.3";
        if (!Internal.isAppVersionGreatThan(startVersion)) {
            Internal.appVersionNotSupportCallback(startVersion);
            return;
        }
        var params = {};
        params.imageRelativePath = image_relative_path;
        params.text = text;

        paramString = Internal.makeParamString("Util", "callSystemShare", params, "call_system_share");

        if (Internal.isIOS) {
            url = Internal.makeURLWithParam(paramString);
            Internal.loadURL(url);
        }
        else if (Internal.isAndroid) {
            window.Util_a.callSystemShare(paramString);
        }
    },

    /**
     * @description 根据URL下载数据
     * @param {String} download_url 需要下载内容的URL
     * @method app_download_data
     * @since v5.3
     * @author jimzhao
     * @example
     CtripUtil.app_download_data("http://www.baidu.com/img/bdlogo.gif");
     //调用该函数后，native会返回H5内容
     var json_obj = {
        tagname:"download_data",
        error_code:"xxxxx",//param_error,download_faild
        param:{downloadUrl:"http://www.baidu.com/bdlogo.gif", savedPath:"../wb_cache/pkg_name/md5_url_hash"}
     };
     app.callback(json_obj);
     */
    app_download_data:function(download_url) {
        var startVersion = "5.3";
        if (!Internal.isAppVersionGreatThan(startVersion)) {
            Internal.appVersionNotSupportCallback(startVersion);
            return;
        }

        var params = {};
        params.downloadUrl = download_url;
        params.pageUrl = window.location.href;

        var paramString = Internal.makeParamString("Util", "downloadData",params,"download_data");
        if (Internal.isIOS) {
            var url = Internal.makeURLWithParam(paramString);
            Internal.loadURL(url);
        }
         else if (Internal.isAndroid) {
            window.Util_a.downloadData(paramString);
        }
    }
};

/**
 * @class CtripUser
 * @description 用户相关类
 */
var CtripUser = {

    /**
     * @description 会员登录,native未登录时候，会显示会员登录界面，native会员已登录，直接完成，返回登录的用户信息
     * @since 5.2
     * @method app_member_login
     * @author jimzhao
     * @example 
     CtripUser.app_member_login();
     //调用完成后，H5会收到如下数据
     var userInfo = {
        "timeout":"2013/09/12",
        "data":
        {
          "LoginName":"wwwwww",
          "UserID":"21634352BAC43044380A7807B0699491",
          "IsNonUser":false,
          "UserName":"测试",
          "Mobile":"13845612110",
          "LoginToken":"",
          "LoginCode":0,
          "LoginErrMsg":"登录成功！",
          "Address":"",
          "Birthday":"19841010",
          "Experience":1453333973000,//微妙timestamp
          "Gender":1,
          "PostCode":"111111",
          "VipGrade":30,
          "VipGradeRemark":"钻石贵宾",
          "Email":"wang_peng@163.com",
          "ExpiredTime":"2013-09-12",
          "Auth":"079E643955C63839FF4617743DA20CFD93AFCAF6A82803A6F3ABD9219",
          "IsRemember":0,
          "BindMobile":18688888888
        },  
        "timeby":1
    }

    var json_obj =
    {
        tagname:"member_login",
        param:userInfo,
    }
    app.callback(json_obj);
     */
    app_member_login:function() {
        paramString =  Internal.makeParamString("User", "memberLogin", null, 'member_login');
        if (Internal.isIOS) {
            url = Internal.makeURLWithParam(paramString);
            Internal.loadURL(url);
        }
        else if (Internal.isAndroid) {
            window.User_a.memberLogin(paramString);
        }
    },

     /**
      * @description 非会员登录
      * @since 5.2
      * @method app_non_member_login
      * @author jimzhao
      * @see app_member_login
      * @example 
      CtripUser.app_non_member_login();
      //调用后，H5会收到native回调的数据
      //回调的数据格式参考app_member_login()
     var userInfo = {
        "timeout":"2013/09/12",
        "data":
        {
          "LoginName":"wwwwww",
          "UserID":"21634352BAC43044380A7807B0699491",
          "IsNonUser":false,
          "UserName":"测试",
          "Mobile":"13845612110",
          "LoginToken":"",
          "LoginCode":0,
          "LoginErrMsg":"登录成功！",
          "Address":"",
          "Birthday":"19841010",
          "Experience":1453333973000,//微妙timestamp
          "Gender":1,
          "PostCode":"111111",
          "VipGrade":30,
          "VipGradeRemark":"钻石贵宾",
          "Email":"wang_peng@163.com",
          "ExpiredTime":"2013-09-12",
          "Auth":"079E643955C63839FF4617743DA20CFD93AFCAF6A82803A6F3ABD9219",
          "IsRemember":0,
          "BindMobile":18688888888
        },  
        "timeby":1
    }

    var json_obj =
    {
        tagname:"member_login",
        param:userInfo,
    }
    app.callback(json_obj);
      */
    app_non_member_login:function() {
        paramString =  Internal.makeParamString("User", "nonMemberLogin", null, 'non_member_login');
        if (Internal.isIOS) {
            url = Internal.makeURLWithParam(paramString);
            Internal.loadURL(url);
        }
        else if (Internal.isAndroid) {
            window.User_a.nonMemberLogin(paramString);
        }
    },

 
     /**
      * @description 会员自动登录,对于已经在native登陆的用户，app会通过调用callback回传登录数据，H5页面需要处理用户信息， 不显示输入用户名密码界面
      * @since 5.2
      * @method app_member_auto_login
      * @author jimzhao
      * @see app_member_login
      * @example 
      CtripUser.app_member_auto_login();
      //调用后，H5会收到native回调的数据
      //回调的数据格式参考app_member_login()
     var userInfo = {
        "timeout":"2013/09/12",
        "data":
        {
          "LoginName":"wwwwww",
          "UserID":"21634352BAC43044380A7807B0699491",
          "IsNonUser":false,
          "UserName":"测试",
          "Mobile":"13845612110",
          "LoginToken":"",
          "LoginCode":0,
          "LoginErrMsg":"登录成功！",
          "Address":"",
          "Birthday":"19841010",
          "Experience":1453333973000,//微妙timestamp
          "Gender":1,
          "PostCode":"111111",
          "VipGrade":30,
          "VipGradeRemark":"钻石贵宾",
          "Email":"wang_peng@163.com",
          "ExpiredTime":"2013-09-12",
          "Auth":"079E643955C63839FF4617743DA20CFD93AFCAF6A82803A6F3ABD9219",
          "IsRemember":0,
          "BindMobile":18688888888
        },  
        "timeby":1
    }

    var json_obj =
    {
        tagname:"member_login",
        param:userInfo,
    }
    app.callback(json_obj);
      */
    app_member_auto_login:function() {
        paramString =  Internal.makeParamString("User", "memberAutoLogin", null, 'member_auto_login');
        if (Internal.isIOS) {
            url = Internal.makeURLWithParam(paramString);
            Internal.loadURL(url);
        }
        else if (Internal.isAndroid) {
            window.User_a.memberAutoLogin(paramString);
        }
    },


     /**
      * @description 用户注册
      * @since 5.2
      * @method app_member_register
      * @author jimzhao
      * @see app_member_login
      * @example 
      CtripUser.app_member_register();
      //调用后，H5会收到native回调的数据
      //回调的数据格式参考app_member_login()
     var userInfo = {
        "timeout":"2013/09/12",
        "data":
        {
          "LoginName":"wwwwww",
          "UserID":"21634352BAC43044380A7807B0699491",
          "IsNonUser":false,
          "UserName":"测试",
          "Mobile":"13845612110",
          "LoginToken":"",
          "LoginCode":0,
          "LoginErrMsg":"登录成功！",
          "Address":"",
          "Birthday":"19841010",
          "Experience":1453333973000,//微妙timestamp
          "Gender":1,
          "PostCode":"111111",
          "VipGrade":30,
          "VipGradeRemark":"钻石贵宾",
          "Email":"wang_peng@163.com",
          "ExpiredTime":"2013-09-12",
          "Auth":"079E643955C63839FF4617743DA20CFD93AFCAF6A82803A6F3ABD9219",
          "IsRemember":0,
          "BindMobile":18688888888
        },  
        "timeby":1
    }

    var json_obj =
    {
        tagname:"member_login",
        param:userInfo,
    }
    app.callback(json_obj);
      */
    app_member_register:function() {
        paramString = Internal.makeParamString("User", "memberRegister", null, 'member_register');
        if (Internal.isIOS) {
            url = Internal.makeURLWithParam(paramString);
            Internal.loadURL(url);
        }
        else if (Internal.isAndroid) {
            window.User_a.memberRegister(paramString);
        }
    }

};
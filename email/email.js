importPackage(javax.mail);
Emailer = {
    _msg: null,
    setup: function(options) {
        var props = new java.util.Properties();
        props.put("mail.smtp.host", options.host);
        props.put("mail.smtp.port", options.port);
        var session = javax.mail.Session.getDefaultInstance(props);
        this._msg = new javax.mail.internet.MimeMessage(session);
        var from = new javax.mail.internet.InternetAddress(options.from);
        this._msg.setFrom(from);
        var to = javax.mail.internet.InternetAddress.parse(options.to);
        this._msg.setRecipients(javax.mail.Message.RecipientType.TO, to);
        this._msg.setSubject(options.subject)
    },
    send: function(text) {
        this._msg.setText(text);
        javax.mail.Transport.send(this._msg);
    }
}

/**
// The following code should import the classes from the jar, but it doesn't quite work.
var mail = {};
(function() {
    var URLClassLoader = Packages.java.net.URLClassLoader
    var URL = java.net.URL
    var File = java.io.File

    var ss = new File("steal/rhino/mail.jar")
    var ssurl = ss.toURL()
    var urls = java.lang.reflect.Array.newInstance(URL, 1)
    urls[0] = new URL(ssurl);
    var clazzLoader = new URLClassLoader(urls);

    importPackage(javax.mail);
    // load Session
    var sess = clazzLoader.loadClass("javax.mail.Session")
    var mthds = sess.getDeclaredMethods()
    var getDefaultInstance;
    for (var i = 0; i < mthds.length; i++) {
        var meth = mthds[i];
        if (meth.toString().match(/getDefaultInstance/))
            getDefaultInstance = meth;
    }
    mail.getDefaultInstance = function(props) {
        return getDefaultInstance.invoke(null, props);
    }

    // load MimeMessage
    var MimeMessage = clazzLoader.loadClass("javax.mail.internet.MimeMessage")
    var mthds = MimeMessage.getDeclaredConstructors();
    var MMconstr;
    for (var i = 0; i < mthds.length; i++) {
        var meth = mthds[i];
        if (meth.toString().match(/javax\.mail\.Session/))
            MMconstr = meth;
    }
    mail.MimeMessage = function(sess) {
        return MMconstr.newInstance(sess);
    }

   // load InternetAddress
    var InternetAddress = clazzLoader.loadClass("javax.mail.internet.InternetAddress")
    var mthds = InternetAddress.getDeclaredConstructors();
    var IAconstr;
    for (var i = 0; i < mthds.length; i++) {
        var meth = mthds[i];
        if (meth.toString().match(/\(java\.lang\.String\)/))
            IAconstr = meth;
    }
    mail.InternetAddress = function(str) {
        return IAconstr.newInstance(str);
    }

    // load Message
    var Message = clazzLoader.loadClass("javax.mail.Message")
    var mthds = Message.getClasses();
    var rec;
    for (var i = 0; i < mthds.length; i++) {
        var meth = mthds[i];
        if (meth.toString().match(/RecipientType/))
            rec = meth;
    }
    var mthds = rec.getDeclaredFields();
    mail.TO = meth.getField("TO");
    mail.RecipientType = rec;

    // load Transport
    var Transport = clazzLoader.loadClass("javax.mail.Transport")
    var mthds = Transport.getDeclaredMethods()
    var send;
    for (var i = 0; i < mthds.length; i++) {
        var meth = mthds[i];
        if (meth.toString().match(/send.*Address/))
            send = meth;
    }
    mail.send = function(msg, to) {
        return send.invoke(null, msg);
    }
})();
**/


//var address = javax.mail.Address;
//var addresses = java.lang.reflect.Array.newInstance(address, 1)
//addresses[0] = to;
/**
importPackage(javax.mail);
var props = new java.util.Properties();
props.put("mail.smtp.host", "MAILHUBCANLB01.archer-tech.com");
props.put("mail.smtp.port", 25);
var session = javax.mail.Session.getDefaultInstance(props);
var msg = new javax.mail.internet.MimeMessage(session);
var from = new javax.mail.internet.InternetAddress("brian.moschel@email.com");
msg.setFrom(from);
var to = new javax.mail.internet.InternetAddress("brian.moschel@archer-tech.com");
msg.setRecipients(javax.mail.Message.RecipientType.TO, to);
msg.setSubject("Test Logs")
msg.setText("boooo");
javax.mail.Transport.send(msg);
**/

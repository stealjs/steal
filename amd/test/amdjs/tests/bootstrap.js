/*jslint strict: false, plusplus: false, evil: true */
/*global document: false, location: false */

(function () {
    var args = location.search.substring(1),
        parts = args.split('&'),
        dohPath = location.href,
        pathRegExp = /\.\.|:|\/\//,
        html = '',
        i, part;

    args = {};

    //Build up the args from querystring parts.
    for (i = 0; (part = parts[i]); i++) {
        part = part.split('=');
        args[decodeURIComponent(part[0])] = decodeURIComponent(part[1]);
    }

    //Set up dohPath
    i = dohPath.indexOf('/tests/');
    dohPath = dohPath.substring(0, i + 1) + 'tests/doh/';

    function write(path) {
        html += '<' + 'script src="' + path + '"></' + 'script>';
    }

    //Only allow impl and config args that do not have relative paths
    //or protocols. Do this to avoid injection attacks on domains that
    //host the test files.
    if (pathRegExp.test(args.impl) || pathRegExp.test(args.config)) {
        alert('invalid impl or config path');
        return;
    }

    write('../../impl/' + args.impl);
    write('../../impl/' + args.config);

    if (location.href.indexOf('doh/runner.html') === -1) {
        write(dohPath + 'runner.js');
        write(dohPath + '_browserRunner.js');
    } else {
        write('../tests.js');
    }

    document.write(html);
}());
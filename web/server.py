#!/usr/bin/python

import sys
import os
from os.path import abspath, isabs, join
import logging
import argparse

from app import app, socketio


def main(arguments=None):

    parser = argparse.ArgumentParser(description='runs the web admin that helps in monitoring Clouds usage')
    parser.add_argument('-b', '--bind', type=str, default='0.0.0.0', help='the ip that web app will bind to')
    parser.add_argument('-p', '--port', type=int, default=8888, help='the port that web interface will bind to')
    parser.add_argument('-c', '--config-file', type=str, default='', help='the configuration file that will be used')
    parser.add_argument('-d', '--debug', default=False, action='store_true', help='indicates that web app will be run in debug mode')
    args = parser.parse_args(arguments)

    logging.basicConfig(level=getattr(logging, 'WARNING'))

    if args.config_file:
        config_path = args.config_file
        if not isabs(args.config_file):
            config_path = abspath(join(os.curdir, args.config_file))

        app.config.from_pyfile(config_path, silent=False)
    else:
        app.config.from_object('config')

    try:
        logging.debug('Clouds web app running at %s:%d' % (args.bind, args.port))
        socketio.run(app, host=app.config['WEB_HOST'], port=app.config['WEB_PORT'])
    except KeyboardInterrupt:
        print
        print "-- Clouds web app closed by user interruption --"

if __name__ == "__main__":
    main(sys.argv[1:])

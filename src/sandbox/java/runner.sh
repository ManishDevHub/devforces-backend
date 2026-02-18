#!/bin/sh
javac Solution.java Runner.java || exit 1
java Runner

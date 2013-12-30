#!/bin/bash
# script to check gocr results of new versions against a testbase
# to ensure that recognition is not worse than a minimum level,
# testbase is a base of (png,pnm,jpg)-image files and a textfile
# with the same name and suffix .txt appended
# containing the desired output, differences will be shown
#
# example:
#  bin/gocr_chk.sh testbase/free/{clean,glued,dusty}/{numbers,text}/
#
# ToDo: output final statistics
# version
#  2009-07-29 numfiles=  6 bad= 3  sumchars=  269 bad= 13  5.20% tmp09 jocr
#  2010-08-09 numfiles= 10 bad= 0  sumchars= 1203 bad=  0  0.00% tmp09
#  2010-09-24 numfiles= 17 bad= 0  sumchars= 1665 bad=  0  0.00% tmp09-10
#  2010-09-24 numfiles= 26 bad= 5  sumchars= 4671 bad= 58  1.24% tmp08-10
#  2010-10-10 numfiles= 35 bad= 3  sumchars= 5919 bad= 19  0.32% tmp08-10+ex
#  latest test: ./jocr/bin/gocr_chk.sh tmp08 tmp09 tmp10 jocr/examples/
#
GOCR=gocr
numfiles=0      # number of checked files
numbad=0        # bad recognitions (ToDo: false positive, false negative)
numgood=0       # good recognitions
sumchars=0      # tested chars
badchars=0      # bad chars
dirs=.
tmpdir=/tmp/tmp_${USER}_gocr # temporary directory
mkdir -p $tmpdir
# echo $tmpdir
numbers=0       # check numbers only? (not implemented)
if test "$1" = "-n";    then numbers=1; shift; fi
if [[ -d "$1" ]];       then dirs="$*"; fi
if [[ -x ./gocr ]];     then GOCR=./gocr; fi
if [[ -x ./src/gocr ]]; then GOCR=./src/gocr; fi
# minimum sample filter
filter="-name \*.p[bgpn]m.txt"
# additional samples
if [[ -x $(which pngtopnm) ]] >/dev/null 2>&1; then
 filter="$filter -o -name \*.png.txt"; fi
if [[ -x $(which djpeg)    ]] >/dev/null 2>&1; then
 filter="$filter -o -name \*.jpg.txt"; fi
if [[ -x $(which gzip)     ]] >/dev/null 2>&1; then
 filter="$filter -o -name \*.p?m.gz.txt"; fi
if [[ -x $(which bzip2)    ]] >/dev/null 2>&1; then
 filter="$filter -o -name \*.p?m.bz2.txt"; fi
# echo "GOCR = $GOCR  dirs = $dirs  filter = $filter"
# eval "find $dirs $filter"
# get all txt-files
for tfile in $(eval "find $dirs $filter | xargs"); do
  # filter out those files, where a 2nd file exist without suffix txt
  ifile=$(echo ${tfile} | sed 's/\.txt//')
  if [ -r $ifile ]; then
    # count files
    numfiles=$(($numfiles+1))
    # count number of chars in txt-file
    numchars=$(cat ${tfile} | wc -m)
    # printf "test %-59s chars= %4d\n" "${ifile}" $numchars
    # add num chars to overall char counter
    sumchars=$(($sumchars + $numchars))
    # diff -b=ignore_whitespace_changes -B=ignore_empty_lines
    #      -u=unified_output_format --=divide_options_from_arguments
    #    return=$?: 0=same 1=differ
    # alternatives: cmp(bytewise diff),sdiff
    # redirect error channel to avoid pngtopnm xscale-warnings
    ${GOCR} ${ifile} > $tmpdir/out 2>/dev/null
    if diff -B -b -- ${tfile} $tmpdir/out >/dev/null; then
      numgood=$(($numgood+1))
      x=0
    else
      # cmp -l: count different chars (includes whitespace)
      #  bad counting after missing or additional chars
      # cmp-out: charnum ibyte obyte
      # ToDo: normalize spaces, newlines, add/delete chars for bad length?
      # ToDo:  add/sub chars on start of biggest differing block
      # use trick = insert \n after each char + diff for counting ???
      #   sed 's/\(.\)/\1\n/g' # does not work on tru64, & for \1 works
      #   + diff ~/a1 ~/a2 | grep -c ^\<
      #  + extra diff for displaying the problem
      # avoid "cmp: EOF on -." message
      #x=$(cmp -l ${tfile} $tmpdir/out 2>/dev/null | wc -l)
      sed 's/\(.\)/&\n/g' ${tfile}    > $tmpdir/a1
      sed 's/\(.\)/&\n/g' $tmpdir/out > $tmpdir/a2
      x=$( diff  $tmpdir/a1 $tmpdir/a2 | grep -c ^\< )
      badchars=$(($badchars+$x))
      numbad=$(($numbad+1))
      diff -b -- ${tfile} $tmpdir/out
    fi
    printf "test %-49s chars= %4d bad= %4d\n" "${ifile}" $numchars $x
  fi
done
#fdate=$(date +%F) # linux only yyyy-mm-dd
fdate=$(date +%Y-%m-%d) # linux + tru64
if [[ $sumchars -gt 0 ]]; then
 echo -e " : $fdate numfiles= $numfiles bad= $numbad  sumchars= $sumchars bad= $badchars  $(echo $badchars $sumchars | LANG=C awk '{printf "%.2f%%\n",$1*100/$2 }')"
else
 echo -e " : $fdate numfiles= $numfiles bad= $numbad  sumchars= $sumchars bad= $badchars  ?"
fi

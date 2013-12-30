#!/bin/sh
# --- tcl/tk-GUI for gocr --- (c) Joerg Schulenburg
#  start: wish gocr.tcl
#
#  tested on: tk8.0 (linux,win95)
#
# ToDo:
#  - better using wishx with extended Tcl? (for pipe etc.)
#  - Reading from stderr of child???
#
# this is a multiline comment in wish, but not in sh \
exec wish -f $0 $@

set ver 0.3.6
set gocrver 0.3.5

# v0.3.6
#  - adaption to gocr v0.3, new options
# ToDo:
#  - xviewer as option (xli), proc view { image } { handle it }
#    image gif ppm pgm (use xli -geometry WxH[{+-}X{+-}Y] out30.bmp #!)
#  - output file as option, colored text (bad chars red)
#  - last/current command on status line (at bottom)
#  - capture error channel from gocr seperately
#  - use -f inifile as option
#
# Thanks to famous tk/tcl developper! Realy good language for x11 beginner.
#
wm title . "GOCR Tcl frontend $ver"

set spacewidth 0
set graylevel 160
set dustsize 20
set imgviewer "xli -geometry 400x400 "
set gocrpath "gocr"
set gocraddopt "-e - -f UTF8"
set file "../examples/text.pbm"
set ofile "out01.txt"
# entry out{n+1}.txt can automaticly generated!
if  $argc {
 puts " ignore $argc arguments: $argv"
}

frame .mbar -borderwidth 1 -relief raised
pack .mbar -fill x

menubutton .mbar.file -text "File" -menu .mbar.file.m
pack .mbar.file -side left
menu .mbar.file.m
# .mbar.file.m add command -label "create font1.pbm" -command exit
.mbar.file.m add command -label "Clear output" -command {$log delete 0.0 end}
.mbar.file.m add command -label "Save output" -command {ofileDialog .mbar.file.m; SaveText $ofile}
.mbar.file.m add command -label "Exit" -command exit


menubutton .mbar.options -text "Options" -menu .mbar.options.m
pack .mbar.options -side left
menu .mbar.options.m
.mbar.options.m add command -label "set Options" -command Option
.mbar.options.m add command -label "Save options" -command SaveOpt
.mbar.options.m add command -label "Load options" -command LoadOpt
set m1 0
set m2 0
set m3 0
set m4 0
set m5 0
set m6 0
set v0 0
set v1 0
set v2 0
set v3 0
set v4 0
set v5 0
# set for automatic detection
set autos 1
set autol 1
set autod 1


menubutton .mbar.help -text "Help" -menu .mbar.help.m
pack .mbar.help -side right
menu .mbar.help.m
.mbar.help.m add command -label "About" -command aboutBox
# .mbar.help.m add command -label "Version"

# --------------------- action frame -----------------------
frame .abar -borderwidth 1 -relief sunken
pack .abar -fill x

set but [button .abar.go -text "Run it" -command Run]
#button .abar.go -text "Run it" -command { Run }
pack .abar.go -side left

set f .abar
set w .abar
label .abar.labf -text "File:"
button .abar.file -text "Browse" -command "fileDialog $w $f.entf open"
button .abar.show -text "Show" -command "Show"
button .abar.spell -text "Spell" -command "Spell"
button .abar.scan -text "Scan" -command "Scan"
entry .abar.entf -width 40
pack .abar.labf -side left
pack .abar.entf -side left
pack .abar.file -side left
pack .abar.show -side left
pack .abar.spell -side left
pack .abar.scan -side left
.abar.entf insert 0 $file

label .abar.status -text "ready"
pack .abar.status -side right

# ------------------ canvas, text ? -----------------
#canvas .pad -background white
#pack .pad

frame .t
#text .t
#pack .t
##.t insert end "history:"
##.t configure -state disabled


set log [text .t.log -width 80 -height 30 \
  -borderwidth 2 -relief raised -setgrid true\
  -yscrollcommand {.t.scroll set}]
scrollbar .t.scroll -command {.t.log yview}
pack .t.scroll -side right -fill y
pack .t.log -side left -fill both -expand true
# pack .t -side top -fill both -expand true
#####################################################

frame .tmsg
set log2 [text .tmsg.log -width 80 -height 5 \
  -borderwidth 2 -relief raised -setgrid true\
  -yscrollcommand {.tmsg.scroll set}]
scrollbar .tmsg.scroll -command {.tmsg.log yview}
pack .tmsg.scroll -side right -fill y
pack .tmsg.log -side left -fill both -expand true
pack .t .tmsg -side top -fill both -expand true
#####################################################

bind .abar.entf <Return> Run
bind .abar.entf <Control-c> Stop
focus .abar.entf


$log2 insert end "\n   ! ! !  This program is in development.  Use carefully ! ! !\n\n"

# tk_messageBox -icon info -type ok -title "Info" -message \
#  "This program is in development!\nUse carefully!\n"


# --------------------- File ---------------------
# see /usr/lib/tk8.0/demos/filebox.tcl
proc fileDialog {w ent operation} {
    #   Type names		Extension(s)	Mac File Type(s)
    #
    #---------------------------------------------------------
    set types {
        {"PNM files"		{.pnm .pbm .pgm .ppm}	}
        {"Image Files"		{.tga .pcx}		}
        {"Image Files"		{.gif .bmp .tiff .png}	}
        {"Image Files"		{.jpeg .jpg}		}
        {"Image Files"		""		{GIFF JPEG}}
        {"All files"		*}
    }
    if {$operation == "open"} {
      set file [tk_getOpenFile -filetypes $types -parent $w]
    } else {
      set file [tk_getSaveFile -filetypes $types -parent $w \
        -initialfile Untitled -defaultextension .txt]
    }
    if [string compare $file ""] {
        $ent delete 0 end
        $ent insert 0 $file
        $ent xview end
    }
}

# --------------------- oFile ---------------------
# see /usr/lib/tk8.0/demos/filebox.tcl
proc ofileDialog {w} {
    global ofile
    #   Type names		Extension(s)
    set types {
        {"text files"		{.txt .text .asc}	}
        {"HTML files"		{.html .htm}		}
        {"All files"		*}
    }
    set ofile [tk_getSaveFile -filetypes $types -parent $w \
        -initialfile $ofile -defaultextension .txt]
    update
}

# --------------------- Show Picture ---------------------
proc Show {} {
  global file, imgviewer
  set file [.abar.entf get]
  eval exec $imgviewer $file &
}

# --------------------- Spell check ---------------------
proc Spell {} {
  global ofile
# WARNING: this clobbers out.txt (fixme)
  SaveText $ofile
  exec tkispell $ofile &
}

# --------------------- Scan ---------------------
proc Scan {} {
  exec xsane -s -n &
}
   
# --------------------- Options ---------------------
proc SaveOpt {} {
  global v0 v1 v2 v3 v4 v5 m1 m2 m3 m4 m5 m6 spacewidth graylevel dustsize imgviewer ofile
  global autos autod autol gocrpath gocraddopt
  if [catch {open .gocr w} out] {
    puts "open .gocr failed"
    return
  }
  set file [.abar.entf get]
  set vvv  [expr $v0 + $v1 + $v2 + $v3 + $v4 + $v5 ]
  set mode [expr $m1 + $m2 + $m3 + $m4 + $m5 + $m6 ]
  puts $out "vvv $vvv"
  puts $out "mode $mode"
  puts $out "file $file"
  puts $out "ofile $ofile"
  puts $out "spacewidth $spacewidth"
  puts $out "graylevel $graylevel"
  puts $out "dustsize $dustsize"
  puts $out "imgviewer $imgviewer"
  puts $out "autos $autos"
  puts $out "autod $autod"
  puts $out "autol $autol"
  puts $out "gocrpath $gocrpath"
  puts $out "gocraddopt $gocraddopt"
  close $out
}

proc LoadOpt {} {
  global v0 v1 v2 v3 v4 v5 m1 m2 m3 m4 m5 m6 spacewidth graylevel dustsize imgviewer ofile
  global autos autod autol gocrpath gocraddopt
  set file [.abar.entf get]
  set vvv  [expr $v0 + $v1 + $v2 + $v3 + $v4 + $v5 ]
  set mode [expr $m1 + $m2 + $m3 + $m4 + $m5 + $m6 ]
  if [catch {open .gocr r} in] {
    puts "open .gocr failed"
    return
  }
  while {[ gets $in line] >=0} {
    if { [string first "vvv"   "$line"] == 0 } { scan $line "%s%d" buf vvv }
    if { [string first "mode"  "$line"] == 0 } { scan $line "%s%d" buf mode }
    if { [string first "file"  "$line"] == 0 } { scan $line "%s%s" buf file }
    if { [string first "ofile" "$line"] == 0 } { scan $line "%s%s" buf ofile }
    if { [string first "gray"  "$line"] == 0 } { scan $line "%s%d" buf graylevel }
    if { [string first "dust"  "$line"] == 0 } { scan $line "%s%d" buf dustsize }
    if { [string first "imgv"  "$line"] == 0 } { scan $line "%s%d" buf imgviewer }
    if { [string first "autos" "$line"] == 0 } { scan $line "%s%d" buf autos }
    if { [string first "autod" "$line"] == 0 } { scan $line "%s%d" buf autod }
    if { [string first "autol" "$line"] == 0 } { scan $line "%s%d" buf autol }
    if { [string first "gocrpath" "$line"] == 0 } { scan $line "%s%s" buf gocrpath }
    if { [string first "gocraddopt" "$line"] == 0 } { set gocraddopt [ string range "$line" 11 256 ] }
  }
  close $in
  .abar.entf delete 0 end
  .abar.entf insert 0 $file
  .abar.entf xview end
  set v0  [expr $vvv & 1 ]
  set v1  [expr $vvv & 2 ]
  set v2  [expr $vvv & 4 ]
  set v3  [expr $vvv & 8 ]
  set v4  [expr $vvv & 16 ]
  set v5  [expr $vvv & 32 ]
  set m6  [expr $mode & 64 ]
  set m1  [expr $mode & 2 ]
  set m2  [expr $mode & 4 ]
  set m3  [expr $mode & 8 ]
  set m4  [expr $mode & 16 ]
  set m5  [expr $mode & 32 ]
}

# call it once
LoadOpt

# see /usr/lib/tk8.0/demos/check.tcl
proc Option {} {
  global v0 v1 v2 v3 v4 m1 m2 m3 m4 m5 m6 spacewidth graylevel dustsize imgviewer
  global autos autod autol gocrpath gocraddopt
  set w .woption
  catch {destroy $w}
  toplevel $w
  wm title $w "GOCR Options"


set ww $w


 label $ww.msg -wraplength 4i -justify left -text "Here you can set several options for GOCR."
 pack $ww.msg -side top

 frame $w.buttons
 pack $w.buttons -side bottom -fill x -pady 2m
 button $w.buttons.ok   -text "Ok" -command "destroy $w"
 button $w.buttons.vars -text "See Variables" -command "showVars"
 pack $w.buttons.vars $w.buttons.ok -side left -expand 1

 frame $ww.sep1 -relief ridge -bd 1 -height 2
 pack $ww.sep1 -side top -fill x
#  -expand no
 
 frame $ww.scale1
 pack $ww.scale1 -side top -fill x
 label $ww.scale1.label -text "spacewidth:" -width 16
 scale $ww.scale1.scale -orient horizontal -length 200 -from 0 -to 60 \
        -variable spacewidth
 checkbutton $ww.scale1.check -text "auto" -variable autos -onvalue  1 -offvalue  0
 pack $ww.scale1.label $ww.scale1.scale $ww.scale1.check -side left
 
 frame $ww.scale2
 pack $ww.scale2 -side top -fill x
 label $ww.scale2.label -text "graylevel:" -width 16
 scale $ww.scale2.scale -orient horizontal -length 200 -from 0 -to 255 \
        -variable graylevel
 checkbutton $ww.scale2.check -text "auto" -variable autol -onvalue  1 -offvalue  0
 pack $ww.scale2.label $ww.scale2.scale $ww.scale2.check -side left
 
 frame $ww.scale3
 pack $ww.scale3 -side top -fill x
 label $ww.scale3.label -text "dustsize:" -width 16
 scale $ww.scale3.scale -orient horizontal -length 200 -from 0 -to 60 \
        -variable dustsize
 checkbutton $ww.scale3.check -text "auto" -variable autod -onvalue  1 -offvalue  0
 pack $ww.scale3.label $ww.scale3.scale $ww.scale3.check -side left

 frame $ww.sep2 -relief ridge -bd 1 -height 2
 pack $ww.sep2 -side top -fill x
#  -expand no

 # place the checkbuttons in two columns
 frame $ww.cb
 pack $ww.cb -side top -fill x
 frame $ww.cb.cb1 -relief ridge -bd 1 -height 2
 pack $ww.cb.cb1 -side left -fill y
 frame $ww.cb.sep3 -relief ridge -bd 1 -height 2
 pack $ww.cb.sep3 -side left -fill y
 frame $ww.cb.cb2 -relief ridge -bd 1 -height 2
 pack $ww.cb.cb2 -side left -fill y

set ww $w.cb.cb1

 label $ww.msg1 -text "Mode options (work mode):"
 pack $ww.msg1 -side top
 checkbutton $ww.b1 -text "use database"       -variable m1 -onvalue  2 -offvalue  0
 checkbutton $ww.b2 -text "layout analysis"    -variable m2 -onvalue  4 -offvalue  0
 checkbutton $ww.b3 -text "compare _ mode"     -variable m3 -onvalue  0 -offvalue  8
 checkbutton $ww.b4 -text "divide  _ mode"     -variable m4 -onvalue  0 -offvalue 16
 checkbutton $ww.b5 -text "context correction" -variable m5 -onvalue  0 -offvalue 32
 checkbutton $ww.b6 -text "char packing"       -variable m6 -onvalue 64 -offvalue  0
 pack $ww.b1 $ww.b2 $ww.b3 $ww.b4 $ww.b5 $ww.b6 -side top -pady 2 -anchor w


set ww $w.cb.cb2

 label $ww.msg2 -text "Verbose options (output mode):"
 pack $ww.msg2 -side top
 checkbutton $ww.c1 -text "more info"        -variable v0 -onvalue  1 -offvalue 0
 checkbutton $ww.c2 -text "list chapes"      -variable v1 -onvalue  2 -offvalue 0
 checkbutton $ww.c3 -text "list pattern"     -variable v2 -onvalue  4 -offvalue 0
 checkbutton $ww.c4 -text "list all pattern" -variable v3 -onvalue  8 -offvalue 0
 checkbutton $ww.c5 -text "line infos"       -variable v4 -onvalue 16 -offvalue 0
 checkbutton $ww.c6 -text "debug mode"       -variable v5 -onvalue 32 -offvalue 0
 pack $ww.c1 $ww.c2 $ww.c3 $ww.c4 $ww.c5 $ww.c6 -side top -pady 2 -anchor w

set ww $w

 frame $ww.sep4 -relief ridge -bd 1 -height 2
 pack $ww.sep4 -side top -fill x

set ww $w.l1
 frame $ww
 pack $ww -side top -fill x

 label $ww.d1 -text "Image Viewer:" -width 16
 entry $ww.d2 -textvariable imgviewer
 pack $ww.d1 -side left -pady 2 -padx 2 -anchor w
 pack $ww.d2 -side left -pady 2 -padx 2 -fill x -expand 1 -anchor w

set ww $w.l2
 frame $ww
 pack $ww -side top -fill x

 label $ww.e1 -text "GOCR PATH:" -width 16
 entry $ww.e2 -textvariable gocrpath
 pack $ww.e1 -side left -pady 2 -padx 2 -anchor w
 pack $ww.e2 -side left -pady 2 -padx 2 -fill x -expand 1 -anchor w

set ww $w.l3
 frame $ww
 pack $ww -side top -fill x

 label $ww.f1 -text "add OPTIONS:" -width 16
 entry $ww.f2 -textvariable gocraddopt
 pack $ww.f1 -side left -pady 2 -padx 2 -anchor w
 pack $ww.f2 -side left -pady 2 -padx 2 -fill x -expand 1 -anchor w


}

# ----------------------------- showVars -----------------------------
proc showVars {} {
  global fid but log2 file v0 v1 v2 v3 v4 v5 m1 m2 m3 m4 m5 m6 spacewidth graylevel dustsize imgviewer
  global autos autod autol gocrpath gocraddopt
  set file [.abar.entf get]
  set vvv  [expr $v0 + $v1 + $v2 + $v3 + $v4 + $v5 ]
  set mode [expr $m1 + $m2 + $m3 + $m4 + $m5 + $m6 ]
  set run "$gocrpath -v $vvv -m $mode"
  if [ expr $autos == 0 ] { set run "$run -s $spacewidth" }
  if [ expr $autol == 0 ] { set run "$run -l $graylevel" }
  if [ expr $autod == 0 ] { set run "$run -d $dustsize" }
  set run "$run $gocraddopt $file"
  $log2 insert end "run = $run\n"
  update
}

    
# ----------------------------- saveLog -----------------------------
proc SaveText { txtfile } {
  global log
  if [catch {open $txtfile w} out] {
    puts "open $txtfile failed"
    return
  }
  puts $out [$log get 0.0 end]
  close $out
}

    
# ----------------------------- RUN -----------------------------
proc Run {} {
  global fid but log log2 file v0 v1 v2 v3 v4 v5 m1 m2 m3 m4 m5 m6 spacewidth graylevel dustsize imgviewer
  global autos autod autol gocrpath gocraddopt
  set file [.abar.entf get]
  set pin ""
  if [ string match *.p?m.gz $file ] { 
    set pin "gzip -cd $file |"
    set file -
  } elseif [ string match *.gif $file ] { 
    set pin "giftopnm $file |"
    set file -
  } elseif { [ string match *.tif $file ] || [ string match *.tiff $file ] } { 
    set pin "tifftopnm $file |"
    set file -
  } elseif { [ string match *.bmp $file ] } { 
    set pin "bmptopnm $file |"
    set file -
  } elseif { [ string match *.png $file ] } { 
    set pin "pngtopnm $file |"
    set file -
  } elseif { [ string match *.jpg $file ] || [ string match *.jpeg $file ] } { 
    set pin "djpeg -gray -pnm $file |"
    set file -
  }
  set vvv  [expr $v0 + $v1 + $v2 + $v3 + $v4 + $v5 ]
  set mode [expr $m1 + $m2 + $m3 + $m4 + $m5 + $m6 ]
  set run "$pin $gocrpath -v $vvv -m $mode"
  if [ expr $autos == 0 ] { set run "$run -s $spacewidth" }
  if [ expr $autol == 0 ] { set run "$run -l $graylevel" }
  if [ expr $autod == 0 ] { set run "$run -d $dustsize" }
  set run "$run $gocraddopt $file"
  $log2 insert end $run\n
  $log2 see end
  if [catch {open "| $run" } fid] {
    $log2 insert end $fid\n
  } else {
    # puts "listening on $fid (file4)"
    fileevent $fid readable Log
    # How to read from stderr of child???
    .abar.status configure -text "progress"
    update
#    $log insert end $run\n
    $but config -text "Stop !" -command Stop
  }
## gets $fid ; # ead headerline
#  fileevent $fid readable "get_samples $fid"
}

proc Log {} {
  global fid log
  if [eof $fid] { Stop } else {
    gets $fid line
    $log insert end $line\n
    $log see end
  }
}

proc Log2 {} {
  global log2 fid2
  # read from stderr-child???
  if [eof $fid2] { Stop } else {
    gets $fid2 line
    $log2 insert end $line\n
    $log2 see end
  }
}

proc Stop {} {
  global fid but v5
  catch {close $fid}
  $but config -text "Run it" -command Run
  .abar.status configure -text "ready"
  update
}


# aboutBox --
#
#       Pops up a message box with an "about" message
#
proc aboutBox {} {
  global ver gocrver
     tk_messageBox -icon info -type ok -title "About" -message \
    "Tcl/Tk front end\nto GOCR $gocrver\n\nversion $ver (c) 2002 Joerg Schulenburg"
}


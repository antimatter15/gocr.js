#
# using convert from ImageMagick instead of my own jconv version v0.2.8
#   to crop the example images
#
# Version: @(#)ImageMagick 4.1.6 99/01/01 cristy@mystic.es.dupont.com
# Copyright: Copyright 1999 E. I. du Pont de Nemours and Company
# ... hmm, convert seems to use a lot of memory, pnmcrop works better
CROPPG = convert -crop 0x0+1+1

.PHONY: all examples fonts install uninstall clean proper proper_old gif jpg png

all: examples

help:
	echo " make examples       # Fig-examples (very fast)"
	echo " make examples_tex   # TeX-examples (takes lot of time)"
	echo " make [proper|clean] # remove non source stuff"

examples: font21.pcx font22.pcx font23.pcx font24.pcx ex.pcx inverse.pcx\
 rotate45.pcx
	ls -l *.pcx

examples_tex: text.pbm font0.pbm font1.pbm font2.pbm polish.pbm man.pbm
# what about small.pbm? anyone remember?

.SUFFIXES: .ps .tex .dvi .fig .pcx .png .jpg .gif .pbm .gz
.tex.dvi:
	latex $*.tex

.dvi.ps:
	dvips -E -o $*.ps $*.dvi    # -PAPERSIZE=a4

# default font size is 11*mag
# fig2dev can create pcx directly, but only unpacked and incompatible to xli
.fig.pcx:
	fig2dev -L ppm -m 3 $< | ppmtopcx -packed >$@

.fig.pbm:
	fig2dev -L ppm -m 3 $< | ppmtopgm | pgmtopbm -threshold >$@

.fig.png:
	fig2dev -L png -S 4 -m 3 $< >$@

.fig.gif:
	fig2dev -L gif -S 4 -m 3 $< >$@

.fig.jpg:
	fig2dev -L jpeg -S 4 -q 25 -m 3 $< >$@


# some make versions does not set $< in explicit rules (info autoconf)
font21.pcx: font2.fig
	fig2dev -L ppm -m 2 font2.fig | ppmtopcx -packed >$@
	# fig2dev -L pcx -m 2 font2.fig $@

font22.pcx: font2.fig
	fig2dev -L ppm -m 3 font2.fig | ppmtopcx -packed >$@
	# fig2dev -L pcx -m 3 font2.fig $@

font23.jpg: font2.fig
	fig2dev -L jpeg -m 4 font2.fig $@

font23.pgm: font2.fig
	fig2dev -L ppm -m 4 font2.fig | ppmtopgm >$@

font23.pbm: font2.fig
	fig2dev -L ppm -m 4 font2.fig | ppmtopgm | pgmtopbm >$@

font23.gif: font2.fig
	fig2dev -L gif -m 4 font2.fig $@

font23.pnm: font23.gif
	giftopnm $< >$@

font23.pcx: font2.fig
	fig2dev -L ppm -m 4 font2.fig | ppmtopcx -packed >$@

font24.pcx: font2.fig
	fig2dev -L ppm -m 5 font2.fig | ppmtopcx -packed >$@

font.tex: font1.tex
	cp font1.tex font.tex

# unfortunatly gs always creates a4 from boxed-ps, therefore we must crop it
# gs options: pgmraw, pcxmono, laserjet
font0.pbm: font.ps Makefile
	gs -dNOPAUSE -q -r600 -sDEVICE=pbmraw \
	 -sOutputFile=font0.pbm - < font.ps
#	$(CROPPG) font0.pbm font0.pbm
	pnmcrop font0.pbm >a.pbm; mv a.pbm font0.pbm

font1.pbm: font.ps Makefile
	gs -dNOPAUSE -q -r300 -sDEVICE=pbmraw \
	 -sOutputFile=font1.pbm - < font.ps
#	$(CROPPG) font1.pbm font1.pbm
	pnmcrop font1.pbm >a.pbm; mv a.pbm font1.pbm

font2.pbm: font.ps Makefile 
	gs -dNOPAUSE -q -r150 -sDEVICE=pbmraw \
	 -sOutputFile=font2.pbm - < font.ps
#	$(CROPPG) font2.pbm font2.pbm
	pnmcrop font2.pbm >a.pbm; mv a.pbm font2.pbm

polish.pbm: polish.ps Makefile 
	gs -dNOPAUSE -q -r200 -sDEVICE=pbmraw \
	 -sOutputFile=polish.pbm - < polish.ps
#	$(CROPPG) polish.pbm polish.pbm
	pnmcrop polish.pbm >a.pbm; mv a.pbm polish.pbm

text.pbm: text.ps Makefile
	gs -dNOPAUSE -q -r150 -sDEVICE=pbmraw \
	 -sOutputFile=text.pbm - < text.ps
#	 $(CROPPG) text.pbm text.pbm
	pnmcrop text.pbm >a.pbm; mv a.pbm text.pbm
	
small.pbm: small.ps Makefile
	gs -dNOPAUSE -q -r150 -sDEVICE=pbmraw \
	 -sOutputFile=small.pbm - < small.ps
#	 $(CROPPG) text.pbm text.pbm
	pnmcrop small.pbm >a.pbm; mv a.pbm small.pbm

# change this to make a man page to a test.pbm file
man.pbm: Makefile
	man -Tdvi man >man.dvi
	dvips -o man.ps man.dvi
	gs -dNOPAUSE -q -r300 -sDEVICE=pbmraw \
	 -sOutputFile=man.pbm - < man.ps
#	$(CROPPG) man.pbm man.pbm
	pnmcrop man.pbm >a.pbm; mv a.pbm man.pbm
	rm -f man.ps man.dvi

fonts: font0.pbm font1.pbm font2.pbm

clean:
	-rm -f a *.bak *.aux *.log *.dvi man.ps text.ps font.ps polish.ps *~

# two ways to remove examples
# 1) expand all *.gif *.p?m ... and check if basname.fig exist
# 2) expand all *.fig and remove basename.{gif,p?m}
# works only with GnuMake:
suffix:=%.pbm %.pgm %.ppm %.pcx %.png %.gif %.jpg
figobj:= $(filter $(suffix),$(wildcard $(patsubst %.fig,%.*,$(wildcard *.fig))))
# figobj:= $(foreach var,$(wildcard *.p[bgp]m *.pcx *.png *.gif *.jpg),$(if $(wildcard $(basename $(var)).fig),$(var)))
# shell: 
proper: clean
	-rm -f ./font2[1234].{p[bgp]m,pcx,png,gif,jpg}
	-rm -f $(figobj)

proper_old:
	# -rm -f ./{ex,inverse,rotate45,font2[1234]}.{p[bgpna]m,pcx,png,gif,jpg}
	-for xx in *.fig; do\
	 rm -f ./$$(echo $${xx} | sed 's/.fig$$//'){,1,2,3,4}.{p[bgpn]m,pcx,png,gif,jpg} 2>/dev/null;\
	done

gif: $(patsubst %.fig,%.gif,$(wildcard *.fig))
	ls -l *.gif

png: $(patsubst %.fig,%.png,$(wildcard *.fig))
	ls -l *.png

jpg: $(patsubst %.fig,%.jpg,$(wildcard *.fig))
	ls -l *.jpg

install:

uninstall:

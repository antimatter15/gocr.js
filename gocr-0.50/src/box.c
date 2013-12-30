/*
This is a Optical-Character-Recognition program
Copyright (C) 2000-2010  Joerg Schulenburg

This program is free software; you can redistribute it and/or
modify it under the terms of the GNU General Public License
as published by the Free Software Foundation; either version 2
of the License, or (at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program; if not, write to the Free Software
Foundation, Inc., 59 Temple Place - Suite 330, Boston, MA  02111-1307, USA.

 see README for EMAIL address
 
 */

#include <stdio.h>
#include <stdlib.h>
#include <assert.h>
#include <string.h>
#include "gocr.h"
#include "pgm2asc.h"

/* for sorting letters by position on the image
/ ToDo: - use function same line like this or include lines.m1 etc. */
int box_gt(struct box *box1, struct box *box2) {
 // box1 after box2 ?
  if (box1->line > box2->line)
    return 1;
  if (box1->line < box2->line)
    return 0;
  if (box1->x0 > box2->x1)	// before
    return 1;
  if (box1->x1 < box2->x0)	// before
    return 0;
  if (box1->x0 > box2->x0)	// before,  overlapping!
    return 1;

  return 0;
}

/* --- copy part of pix p into new pix b	---- len=10000
 * Returns: 0 on success, 1 on error.
 * naming it as copybox isnt very clever, because it dont have to do with the
 *   char boxes (struct box)
 */
int copybox (pix * p, int x0, int y0, int dx, int dy, pix * b, int len) {
  int x, y;

  /* test boundaries */
  if (b->p == NULL || dx < 0 || dy < 0 || dx * dy > len) {
    fprintf(stderr, " error-copybox x=%5d %5d  d=%5d %5d\n", x0, y0, dx, dy);
    return 1;
  }

  b->x = dx;
  b->y = dy;
  b->bpp = 1;
#ifdef FASTER_INCOMPLETE
  for (y = 0; y < dy; y++)
    memcpy(&pixel_atp(b, 0, y), &pixel_atp(p, x0, y + y0 ), dx);
  // and unmark pixels
#else
  for (y = 0; y < dy; y++)
    for (x = 0; x < dx; x++)
      pixel_atp(b, x, y) = getpixel(p, x + x0, y + y0);
#endif

  return 0;
}

/* reset table of alternative chars (and free memory) */
int reset_box_ac(struct box *box){
  int i;
  for (i=0; i<box->num_ac; i++)
    if (box->tas[i]) {
       /* fprintf(stderr,"DBG free_s[%d] %p %s\n",i,box->tas[i],box->tas[i]); */
       free(box->tas[i]);
       box->tas[i]=0;     /* prevent double freeing */
     }
  box->num_ac=0;  /* mark as freed */
  return 0;
}

/* ini or copy a box: get memory for box and initialize the memory */
struct box *malloc_box (struct box *inibox) {
  struct box *buf;
  int i;

  buf = (struct box *) malloc(sizeof(struct box));
  if (!buf)
    return NULL;
  if (inibox) {
    memcpy(buf, inibox, sizeof(struct box));
    /* only pointer are copied, we want to copy the contents too */ 
    for (i=0;i<inibox->num_ac;i++) {
      if (inibox->tas[i]) {
        buf->tas[i]=(char *)malloc(strlen(inibox->tas[i])+1);
        memcpy(buf->tas[i], inibox->tas[i], strlen(inibox->tas[i])+1);
      }
    }
  }
  else { /* ToDo: init it */
    buf->num_ac=0;
    buf->num_frames=0;
  }
  /* fprintf(stderr,"\nDBG ini_box %p",buf); */
  return buf;
}

/* free memory of box */
int free_box (struct box *box) {
  if (!box) return 0;
  /* fprintf(stderr,"DBG free_box %p\n",box); out_x(box); */
  reset_box_ac(box); /* free alternative char table */
  free(box);         /* free the box memory */
  return 0;
}

/* simplify the vectorgraph, 
 *  but what is the best way?
 *   a) melting two neighbouring vectors with nearly same direction?
 *      (nearest angle to pi)
 *   b) melting three neigbours with smallest area?
 * ToDo:
 * mode = 0 - only lossless
 * mode = 1 - reduce one vector, smallest possible loss
 * mode = 2 - remove jitter (todo, or somewhere else)
 * ToDo: include also loop around (last - first element)
 * ToDo: reduce by 10..50%
 */
int reduce_vectors ( struct box *box1, int mode ) {
  int i1, i2, nx, ny, mx, my, len,
      minlen=1024, /* minlength of to neighbouring vectors */
      besti1=0,  /* frame for best reduction */
      besti2=2;  /* vector replacing its predecessor */
  double  sprod, maxsprod=-1;
  if (mode!=1) fprintf(stderr,"ERR not supported yet, ToDo\n");
  for (i2=1,i1=0; i1<box1->num_frames; i1++) {    /* every frame */
    for (;i2<box1->num_frame_vectors[i1]-1; i2++) { /* every vector */
      /* predecessor n */
      nx = box1->frame_vector[i2-0][0] - box1->frame_vector[i2-1][0];
      ny = box1->frame_vector[i2-0][1] - box1->frame_vector[i2-1][1];
      /* successor   m */
      mx = box1->frame_vector[i2+1][0] - box1->frame_vector[i2-0][0];
      my = box1->frame_vector[i2+1][1] - box1->frame_vector[i2-0][1];
      /* angle is w = a*b/(|a|*|b|) = 1 means parallel   */
      /* normalized: minimize w^2 = (a*b/(|a|*|b|)-1)^2  */
      /*             -1=90grd, 0=0grd, -2=180grd         */
      sprod = /* fabs */(abs(nx*mx+ny*my)*(nx*mx+ny*my)
                       /(1.*(nx*nx+ny*ny)*(mx*mx+my*my))-1);
      if (sprod<0) sprod=-sprod;
      len =           (mx*mx+my*my)*(nx*nx+ny*ny); /* sum lengths^2 */
// ..c          ###c           ...          ..          ...
// .b. len=2+2  #b.. len=2+5   #bc len=1+2  bc len=1+1  b#a len=4+5 
// a.. spr=0    a... spr=1/10  a.. spr=1/4  a. spr=1    ##c spr=9/5
//
      if (   len*   sprod*   sprod*   sprod*   sprod
         <minlen*maxsprod*maxsprod*maxsprod*maxsprod
       || maxsprod<0) /* Bad! ToDo! */
      { maxsprod=sprod; besti1=i1; besti2=i2; minlen=len; }
    }
  }
  if (box1->num_frames>0)
  for (i2=besti2; i2<box1->num_frame_vectors[ box1->num_frames-1 ]-1; i2++) {
    box1->frame_vector[i2][0]=box1->frame_vector[i2+1][0];
    box1->frame_vector[i2][1]=box1->frame_vector[i2+1][1];
  }
  for (i1=besti1; i1<box1->num_frames; i1++)
    box1->num_frame_vectors[i1]--;
//  fprintf(stderr,"\nDBG_reduce_vectors i= %d nv= %d sprod=%f len2=%d\n# ...",
//     besti2,box1->num_frame_vectors[ box1->num_frames-1 ],maxsprod,minlen);
//  out_x(box1);
  return 0;
}

/* add the contents of box2 to box1
 * especially add vectors of box2 to box1
 */
int merge_boxes( struct box *box1, struct box *box2 ) {
  int i1, i2, i3, i4;
  struct box tmpbox, *bsmaller, *bbigger; /* for mixing and sorting */
  /* DEBUG, use valgrind to check uninitialized memory */
#if 0
  fprintf(stderr,"\nDBG merge_boxes_input:"); out_x(box1); out_x(box2);
#endif
  /* pair distance is to expendable, taking borders is easier */
  // JS-2010-09 fix bug width=1
  if ((box2->x1 - box2->x0 + 1)*(box2->y1 - box2->y0 + 1)
     >(box1->x1 - box1->x0 + 1)*(box1->y1 - box1->y0 + 1)) {
      bbigger=box2; bsmaller=box1; }
  else {
      bbigger=box1; bsmaller=box2; } // if called by glue_holes_inside_chars()
  // fprintf(stderr,"\n y bigger"); out_x(bbigger); out_x(bsmaller);
  /* ToDo: does not work if a third box is added */
  if (box2->y0>box1->y1 || box2->y1<box1->y0
   || box2->x0>box1->x1 || box2->x1<box1->x0) {
    box1->num_boxes    += box2->num_boxes;    /* num separate objects 2=ij */
//    if ( 4 * box2->y1 < 3*box1->y0 + box1->y1
//      &&     box2->y0 <   box1->y0 ) (box1->dots)++; // 2010-09-24 ???
    if ( 4 * box1->y1 < 3*box2->y0 + box2->y1
      &&     box1->y0 <   box2->y0 ) (box2->dots)++; // 2010-09-24 :
  } else {
    if (box2->num_boxes>box1->num_boxes) box1->num_boxes=box2->num_boxes;
    // 2010-09 subboxes are already counted, do not count twice!
    box1->num_subboxes = bbigger->num_subboxes; /* num holes 1=abdepq 2=B */
    // box1->num_subboxes += box2->num_subboxes+1; /* num holes 1=abdepq 2=B */
  }
  box1->dots         += box2->dots;         /* num i-dots ??? */
  if ( box2->x0 < box1->x0 ) box1->x0 = box2->x0; 
  if ( box2->x1 > box1->x1 ) box1->x1 = box2->x1;
  if ( box2->y0 < box1->y0 ) box1->y0 = box2->y0;
  if ( box2->y1 > box1->y1 ) box1->y1 = box2->y1;
  i1 = i2 = 0;
  if (bbigger->num_frames) 
    i1 =  bbigger->num_frame_vectors[  bbigger->num_frames - 1 ];
  if (bsmaller->num_frames)
    i2 = bsmaller->num_frame_vectors[ bsmaller->num_frames - 1 ];
  while (i1+i2 > MaxFrameVectors) {
    if (i1>i2) { reduce_vectors(  bbigger, 1 ); i1--; }
    else       { reduce_vectors( bsmaller, 1 ); i2--; }
  }
  /* if i1+i2>MaxFrameVectors  simplify the vectorgraph */
  /* if sum num_frames>MaxNumFrames  through shortest graph away and warn */
  /* first copy the bigger box */
  memcpy(&tmpbox, bbigger, sizeof(struct box));
  /* attach the smaller box */
  for (i4=i3=0; i3<bsmaller->num_frames; i3++) {
    if (tmpbox.num_frames>=MaxNumFrames) break;
    
    for  (; i4<bsmaller->num_frame_vectors[i3]; i4++) {
      memcpy(tmpbox.frame_vector[i1],
          bsmaller->frame_vector[i4],2*sizeof(int));
      i1++;
    }
    tmpbox.num_frame_vectors[ tmpbox.num_frames ] = i1;
    tmpbox.frame_vol[ tmpbox.num_frames ] = bsmaller->frame_vol[ i3 ];
    tmpbox.frame_per[ tmpbox.num_frames ] = bsmaller->frame_per[ i3 ];
    tmpbox.num_frames++;
    if (tmpbox.num_frames>=MaxNumFrames) {
      if (OCR_JOB->cfg.verbose)
        fprintf(stderr,"\nDBG merge_boxes MaxNumFrames reached");
      break;
    }
  }
  /* copy tmpbox to destination */
  box1->num_frames = tmpbox.num_frames;
  memcpy(box1->num_frame_vectors,
         tmpbox.num_frame_vectors,sizeof(int)*MaxNumFrames);
  memcpy(box1->frame_vol,
         tmpbox.frame_vol,sizeof(int)*MaxNumFrames);
  memcpy(box1->frame_per,
         tmpbox.frame_per,sizeof(int)*MaxNumFrames);
  memcpy(box1->frame_vector,
         tmpbox.frame_vector,sizeof(int)*2*MaxFrameVectors);
#if 0
  if ((OCR_JOB->cfg.verbose&48)==48) {
    fprintf(stderr,"\nDBG merge_boxes_result:"); out_x(box1); }
#endif
  return 0;
}

/* used for division of glued chars
 * after a box is splitted into 2, where vectors are copied to both,
 * vectors outside the new box are cutted and thrown away,
 * later replaced by
 *  - 1st remove outside vectors with outside neighbours (complete frames?)
 *        add vector on outside vector with inside neighbours
 *        care about connections through box between outside vectors 
 *  - 2nd reduce outside crossings (inclusive splitting frames if necessary)
 *        depending on direction (rotation) of outside connections
 *  - 3th shift outside vectors to crossing points
 *  - split add this points, connect only in-out...out-in,
 *  - cutting can result in more (fi) or less objects (ke)
 * ToDo:
 *       dont connect  --1---4--------3----2--  new-y1 (inside above not drawn)
 *                        \   \-<<<<-/    /             outside
 *                         \---->>>>-----/      old-y1
 *                            |======| subtractable? 
 *
 *       only connect  --1---2--------3----4--  new-y1
 *                        \>>/        \>>>/     old-y1  outside
 *  ToDo: what about cutting 2 frames (example: 2fold melted MN,ke)
 *        better restart framing algo (modified pgm2asc.frame_vector())?
 *        (would be require pixel last 3 bits modifications?)
 *
 *  ToDo: new vol, per
 * sample: tmp08/gocr0810* 2010-10-12
 frame 0 ( +66, 50,21)
  #00  0  0 #01  0  8 #02  0  6 #03  1  5 #04  4  8 #05  5  8 #06  6  7
  #07  7  8 #08 11  8 #09  8  8 #10  6  6 #11  7  5 #12 12  5 #13 12  3
  #14 11  2 #15  7  2 #16  6  3 #17  5  2 #18  4  2 #19  1  5 #20  0  4
 frame 1 ( -10, 13, 8)  
  #21  4  3 #22  5  2 #23  6  3 #24  6  7 #25  5  8 #26  2  5 #27  2  4 
  #28  3  3
 frame 2 (  -8, 12, 7)  
  #29  7  3 #30  8  2 #31 10  2 #32 12  4 #33 11  5 #34  7  5 #35  6  4
  # list pattern  d=  13   9
  $............  @............<-
  @............  @............ 
  @...$$.$$@$$.  @...@@.@@@@@.<
  @..$$.$$...@$  @..@@.@@...@@
  $.$...$.....$  @.@...@.....@
  @$$...@$@@@$$  @@@...@@@@@@@  
  $.@@..$......  @.@@..@......  
  @..@@.$@.....  @..@@.@@.....  
  $...$$.$$@@$.  @...@@.@@@@@.<-
       ^cut           ^cut     
  1st) get a list of cutting positions and sort them (going along border):
     [#05-#06(5,8,io)   #16-#17(5,2,oi)] [#22-#23(5,2,io)   #24-#25(5,8,oi)]
     [#05-#06(5,8,io)  [#24-#25(5,8,oi)   #22-#23(5,2,io)]  #16-#17(5,2,oi)]
     // positive rotation momentum io(0)->io(1)->oi(0)->oi(1)->back
     // io=inside_to_outside oi=outside_to_inside
  2nd) 
   rebuild frames ... #04 #05 - #25 #26 #27 #28 #21 #22 #23 - #17 #18 ...
 */
#if 0  // new version 1010-10 works on cutting multiple frames
#define MAXNUMCUTS 8   // used in function cut_box() only
int cut_box( struct box *box1) {
  int i1, i2, i3, i4, i4l, i5, x, y, lx, ly, dbg=0;
  int cut_num = 0,         // number of cuts
      cut_idx[MAXNUMCUTS], // index to cutted vector
      cut_dir[MAXNUMCUTS]; // direction of vector inside_outside=1
                           //                     outside_inside=2
  struct box tmpbox; // = (*box1); temp. buffer, after some corrections
#ifdef DO_DEBUG
  if (OCR_JOB->cfg.verbose) dbg=1+2;  // debug level, enlarge to get more output
#endif  
  if (dbg) fprintf(stderr,"\n cut box x= %3d %3d", box1->x0, box1->y0);
  /* check if complete frames are outside the box */
  for (i1=0; i1<box1->num_frames; i1++){
    if (dbg>2) fprintf(stderr,"\n checking frame %d ", i1);
    /* using frame_per as marker first (recalculate later) */
    i2 = ((i1)?box1->num_frame_vectors[ i1-1 ]:0); // start of this frame
    i3 =       box1->num_frame_vectors[ i1   ];    // start of next frame
    x = box1->frame_vector[ i3-1 ][0]; /* initial */
    y = box1->frame_vector[ i3-1 ][1]; /* initial */
    i4l = i3 - 1; // initial index of last vector
    if (x<box1->x0 || x>box1->x1 || y<box1->y0 || y>box1->y1) i5=1; // outside
    for (i4=i2; i4 < i3; i4++) {
      lx = x; /* last x = vector[i4l] */
      ly = y; /* last y = vector[i4l] */
      x = box1->frame_vector[i4][0];
      y = box1->frame_vector[i4][1];
      // fprintf(stderr,"DBG LEV3 i4= %3d  xy= %3d %3d",i4,x,y);
      /* check if outside */
      if (x<box1->x0 || x>box1->x1 || y<box1->y0 || y>box1->y1) { // outside
        /* replace by nearest point at border, ToDo: better crossingpoint */
        if (i5==0) {  /* inside_to_outside, wrong if it starts outside */
          if (x < box1->x0) x = box1->frame_vector[i4][0] = box1->x0;
          if (x > box1->x1) x = box1->frame_vector[i4][0] = box1->x1;
          if (y < box1->y0) y = box1->frame_vector[i4][1] = box1->y0;
          if (y > box1->y1) y = box1->frame_vector[i4][1] = box1->y1;
          if (cut_num<MAXCUTNUM) {
            cut_idx[cut_num] = i4;
            cut_dir[cut_num] = 1; // inside_to_outside
            cut_num++;
          }
          /* search other frames for near outside_to_inside and copy frame in */
        }
        i5 = 1; // flag: we_are_outside_of_box
      } else if (i5==1) {   /* outside_to_inside */
        /* ToDo: better crossing point last vector and border */
        if (lx < box1->x0) lx = box1->x0;
        if (lx > box1->x1) lx = box1->x1;
        if (ly < box1->y0) ly = box1->y0;
        if (ly > box1->y1) ly = box1->y1;
        box1->frame_vector[i4l][0] = lx;
        box1->frame_vector[i4l][1] = ly;
        if (cut_num<MAXCUTNUM) {
          cut_idx[cut_num] = i4l;
          cut_dir[cut_num] = 2; // outside_to_inside
          cut_num++;
        }
        i5 = 0; // flag: we_are_inside_of_box
      }
      i4l=i4; // index of last vector
      // fprintf(stderr," xy= %3d %3d\n",x,y);
    }
  }
  for (i1=0; i1<cut_num; i1+=2) {
  }
  if (dbg>2) { fprintf(stderr,"\nDBG cut_box_result:"); out_x(box1); }
  return 0;
}
#else  // old bad version works for one cutted frame only
int cut_box( struct box *box1) {
  int i1, i2, i3, i4, x, y, lx, ly, dbg=0;
#ifdef DO_DEBUG
  if (OCR_JOB->cfg.verbose) dbg=1+2;  // debug level, enlarge to get more output
#endif  
  if (dbg) fprintf(stderr,"\n cut box x= %3d %3d", box1->x0, box1->y0);
  /* check if complete frames are outside the box */
  for (i1=0; i1<box1->num_frames; i1++){
    if (dbg>2) fprintf(stderr,"\n checking frame %d ", i1);
    /* using frame_per as marker first (recalculate later) */
    box1->frame_per[i1]=0;
    i2 = ((i1)?box1->num_frame_vectors[ i1-1 ]:0); // this frame
    i3 =       box1->num_frame_vectors[ i1   ];    // next frame
    for (i4=i2; i4 < i3; i4++) {
      x = box1->frame_vector[i4][0];
      y = box1->frame_vector[i4][1];
      /* 1 if one vector is lying inside */
      /* 2 if one vector is lying outside */
      if (x>=box1->x0 && x<=box1->x1
       && y>=box1->y0 && y<=box1->y1) box1->frame_per[i1]|=1;
      if (x< box1->x0 || x> box1->x1
       || y< box1->y0 || y> box1->y1) box1->frame_per[i1]|=2;
    }
    if (dbg>2) fprintf(stderr,"in1+out2= %d", box1->frame_per[i1]);
    if (box1->frame_per[i1]==2) { /* all vectors outside */
      if (dbg>1) fprintf(stderr," remove frame %d",i1);
      /* replace all frames i1,i1+1,... by i1+1,i1+2,... */
      /* replace (x,y) pairs first */
      for (i4=i2; i4<box1->num_frame_vectors[ box1->num_frames-1 ]-(i3-i2);
           i4++) {
        box1->frame_vector[i4][0] = box1->frame_vector[i4+i3-i2][0];
        box1->frame_vector[i4][1] = box1->frame_vector[i4+i3-i2][1];
      }
      /* replace the num_frame_vectors */
      for (i4=i1; i4<box1->num_frames-1; i4++) {
        box1->num_frame_vectors[ i4 ] =
          box1->num_frame_vectors[ i4+1 ]-(i3-i2);
        box1->frame_vol[i4]=box1->frame_vol[i4+1];
        box1->frame_per[i4]=box1->frame_per[i4+1];
      }
      box1->num_frames--; i1--;
    }
  }
  /* remove vectors outside the box and connect vectors pointing outside
   *  to next vectors pointing inside (every frame), see above sample "ke" 
   *    ToDo: partly implemented, start i2source=search = i2dest=trace,
  *       i2source>i2dest on reconnect (evl. frame number changed)
   */
  i3=0; /* flag 0=inside=no_change 1++=outside_remove_or_concat */
  for (i1=0; i1<box1->num_frames; i1++){
    if (dbg>2) fprintf(stderr,"\n check cutting vectors on frame %d", i1);
    x = box1->frame_vector[0][0]; /* initial x */
    y = box1->frame_vector[0][1]; /* initial y */
    /* ToDo: start inside to get a closed object */
    if (x<box1->x0 || x>box1->x1 || y<box1->y0 || y>box1->y1) i3=1;
    for (i2=0; i2<box1->num_frame_vectors[ i1 ]; i2++) {
      lx = x; /* last x */
      ly = y; /* last y */
      x = box1->frame_vector[i2][0];
      y = box1->frame_vector[i2][1];
      // fprintf(stderr,"DBG LEV3 i2= %3d  xy= %3d %3d",i2,x,y);
      /* check if outside */
      if (x<box1->x0 || x>box1->x1 || y<box1->y0 || y>box1->y1) {
        /* replace by nearest point at border, ToDo: better crossingpoint */
        if (i3==0) {  /* inside_to_outside, wrong if it starts outside */
          if (x < box1->x0) x = box1->frame_vector[i2][0] = box1->x0;
          if (x > box1->x1) x = box1->frame_vector[i2][0] = box1->x1;
          if (y < box1->y0) y = box1->frame_vector[i2][1] = box1->y0;
          if (y > box1->y1) y = box1->frame_vector[i2][1] = box1->y1;
          /* search other frames for near outside_to_inside and copy frame in */
        } else { /* outside_to_outside */
          /* remove vector */
          if (dbg>1) fprintf(stderr,"\n remove vector[%d][%d] x= %2d %2d",i1,i2,x-box1->x0,y-box1->y0);
          for (i4=i2;i4<box1->num_frame_vectors[ box1->num_frames-1 ]-1;i4++) {
            box1->frame_vector[i4][0] = box1->frame_vector[i4+1][0];
            box1->frame_vector[i4][1] = box1->frame_vector[i4+1][1];
          }
          for (i4=i1; i4<box1->num_frames; i4++)
                         box1->num_frame_vectors[ i4 ]--;
          i2--; /* next element is shiftet now, setting back the counter */
        }
        i3++;
        // fprintf(stderr," outside i3= %d\n",i3);
        continue;
      }
      /* outside_or_inside to inside */
      // fprintf(stderr," inside  i3= %d",i3);
      if (i3) { /* outside_to_inside */
        /* ToDo: better crossing point last vector and border */
        if (lx < box1->x0) lx = box1->x0;
        if (lx > box1->x1) lx = box1->x1;
        if (ly < box1->y0) ly = box1->y0;
        if (ly > box1->y1) ly = box1->y1;
        x = box1->frame_vector[i2][0] = lx;
        y = box1->frame_vector[i2][1] = ly;
        i3 = 0;
      }
      // fprintf(stderr," xy= %3d %3d\n",x,y);
    }
  }
  if (dbg>2) { fprintf(stderr,"\nDBG cut_box_result:"); out_x(box1); }
  return 0;
}
#endif

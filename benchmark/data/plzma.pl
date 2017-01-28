#!/usr/bin/perl

use strict;
use warnings;

use Fcntl qw( O_CREAT );
use Fcntl qw( O_WRONLY );
use Fcntl qw( O_RDONLY );
use Fcntl qw( SEEK_SET );
use Getopt::Long;

# default config
my $blocks = 4;

# get from command line
my $result = GetOptions (
  "blocks|b=i" => \$blocks,    # numeric
);

# get main input file
my $file = $ARGV[0];

# assertion for input arguments
die "no input file given" unless defined $file;
die "input file not found" unless -f $file;

sub create_part
{
  my $buffer;
  my ($ih, $part, $off, $end) = @_;
  print STDERR "create $part, $off, $end\n";
  my $path = sprintf("%s.%03d", $file, $part);
  if (sysopen(my $oh, $path, O_WRONLY|O_CREAT)) {
    my $readed = 0;
    truncate($oh, 0);
    my $size = $end - $off;
    sysseek($ih, $off, SEEK_SET);
    while ($readed < $size) {
      my $s = $size > 1024**4 ? 1024**4 : $size;
      my $rv = sysread($ih, $buffer, $s);
      $readed += $rv; # increment readed now
      while ($rv > 0) { # make sure all is written
        my $wr = syswrite($oh, $buffer);
        substr($buffer, 0, $wr, "");
        $rv -= $wr;
      }
    }
  } else {
    die "could not write $path: $!";
  }
  return $path;
}

sub compress_part
{
  my ($ih, $part, $off, $end) = @_;
  my $path = sprintf("%s.%03d", $file, $part);
  print STDERR "compress $path\n";
  system('lzma', 'e', $path, "${path}.lzma");
  return ["${path}.lzma", -s "${path}.lzma"];
}

sub append_part
{
  my $buffer;
  my ($oh, $part) = @_;
  my $path = $part->[0];
  my $size = $part->[1];
  warn "append $path\n";
  if (sysopen(my $ih, $path, O_RDONLY)) {
    my $readed = 0;
    while ($readed < $size) {
      my $s = $size > 1024**4 ? 1024**4 : $size;
      my $rv = sysread($ih, $buffer, $s);
      $readed += $rv; # increment readed now
      while ($rv > 0) { # make sure all is written
        my $wr = syswrite($oh, $buffer);
        substr($buffer, 0, $wr, "");
        $rv -= $wr;
      }
    }
  }
  else {
    die "could not open $file: $!";
  }
}

if (sysopen(my $fh, $file, O_RDONLY)) {

  my @paths;
  my @blocks;
  my $parts = 0;
  my $size = -s $fh;

  # these heuristics need some more file tuning!
  if ($size < 1024**2 * 0.5) { $blocks = 2 if $blocks > 2; } #.5MB
  elsif ($size < 1024**2 * 1) { $blocks = 3 if $blocks > 3; } #1MB
  elsif ($size < 1024**2 * 2) { $blocks = 4 if $blocks > 4; } #2MB
  elsif ($size < 1024**2 * 4) { $blocks = 5 if $blocks > 5; } #4MB
  elsif ($size < 1024**2 * 8) { $blocks = 6 if $blocks > 6; } #8MB
  elsif ($size < 1024**2 * 10) { $blocks = 7 if $blocks > 7; } #10MB
  elsif ($size < 1024**2 * 12) { $blocks = 8 if $blocks > 8; } #12MB

  warn "Splitting $file into $blocks blocks\n";

  my $med = int($size / $blocks) + 1;


  for (my $off = 0; $off < $size; $off += $med) {
    my $end = $off + $med;
    $end = $size if $end > $size;
    push(@paths, create_part($fh, $parts, $off, $end));
    push(@blocks, compress_part($fh, $parts, $off, $end));
    $parts++;
  }

  my $path = sprintf("%s.plzma", $file);
  if (sysopen(my $oh, $path, O_WRONLY|O_CREAT)) {
    truncate($oh, 0);
    syswrite($oh, "PLZMA1");
    syswrite($oh, pack("V", $blocks));
    for (my $i = 0; $i < scalar(@blocks); $i ++) {
      my $length = $blocks[$i]->[1];
      syswrite($oh, pack("V", $length));
      warn "offset $i) $length\n";
    }
    for (my $i = 0; $i < scalar(@blocks); $i ++) {
      append_part($oh, $blocks[$i]);
    }
    for (my $i = 0; $i < scalar(@blocks); $i ++) {
      unlink($blocks[$i]->[0]);
      unlink($paths[$i]);
    }

    warn "created $path\n";

  } else {
    die "could not write $path: $!";
  }


} else {
  die "could not open $file: $!";
}

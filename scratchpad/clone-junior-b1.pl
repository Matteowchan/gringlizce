use strict; use warnings;
# Adult B1 -> Junior B1 kimlik klonu (bytes-safe). Kullanim: perl clone-junior-b1.pl <n>
my $n = $ARGV[0] or die "unit no?";
my $src = "genel-b1-unite-$n.html";
my $dst = "genel-junior-b1-unite-$n.html";
open my $in, '<:raw', $src or die "$src: $!";
local $/; my $s = <$in>; close $in;

# 1) marka basligi (ge-rail-head ONCE, cunku 'Genel Ingilizce B1' onu yakalamaz)
$s =~ s/Genel \xC4\xB0ngilizce &middot; B1/Junior \xC4\xB0ngilizce &middot; B1/g;
# 2) title/meta/comment: 'Genel Ingilizce B1' -> 'Junior Ingilizce B1'
$s =~ s/Genel \xC4\xB0ngilizce B1/Junior \xC4\xB0ngilizce B1/g;
# 3) slug
$s =~ s/ge-b1-u/ge-junior-b1-u/g;
# 4) localStorage
$s =~ s/ge_b1_u/ge_junior_b1_u/g;
# 5) canonical + nav filename
$s =~ s/genel-b1-unite-/genel-junior-b1-unite-/g;
# 6) PAGE_TRACK ekle
$s =~ s/(PAGE_LEVEL='B1',\s*PAGE_UNIT=\d+);/$1, PAGE_TRACK='junior';/;

open my $out, '>:raw', $dst or die "$dst: $!";
print $out $s; close $out;
print "cloned $dst\n";

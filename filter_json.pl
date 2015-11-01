#  filter_json.pl
#
#  filter some json calendar to import in meteor, 
#
#    perl filter_json.pl <some_cal>.json 
#
#  mongoimport --host localhost:3001 -d meteor -c events --jsonArray import.json
            
use strict;
use warnings;
use JSON qw( decode_json encode_json);
use MongoDB;
use MongoDB::OID;
use POSIX qw(strftime);


my ($json_text, $decoded_json, $dumped);


$json_text .= $_ for (<>); 


#print "$. lines, ", length($json_text), " bytes.\n";


$decoded_json = decode_json( $json_text );




my @calevents = @{$decoded_json->{'data'}};
#print "\n\n(1) Calendar event = ", $calevents[0]->{'title'};

my @events = ();
foreach my $t (@calevents) {
 next if ! $t->{'session_title'};
 next if $t->{'session_title'}=~m/^Session/;
 my $event = ();
 $event->{'session_title'} = $t->{'session_title'};
 $event->{'title'} = $t->{'title'};
 $event->{'className'} = $t->{'place'};
 $event->{'className'} =~ s/ //g,
 $event->{'start'} = strftime('%Y-%m-%dT%H:%M:%S', localtime($t->{'start'}));
 $event->{'end'} = strftime('%Y-%m-%dT%H:%M:%S',  localtime($t->{'end'}));
  my $id1 = MongoDB::OID->new;
  $event->{'_id'} = "$id1";

 push @events , $event;
}


print encode_json( \@events );


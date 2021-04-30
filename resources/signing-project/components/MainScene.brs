' ********** Copyright 2016 Roku Corp.  All Rights Reserved. **********
sub init()
    m.top.backgroundURI = ""
    m.top.backgroundColor = "#0D0D0D"
end sub

sub show(args as object)
    m.top.theme = {
        global: {
            OverhangVisible: false
            OverhangShowOptions: false
        }
    }
end sub

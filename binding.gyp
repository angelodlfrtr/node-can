{
  "targets": [
    {
      "target_name": "socketcan",
      "sources": [ "lib/socketcan.cc" ],
      "include_dirs": [
        "<!(node -e \"require('nan')\")"
      ]
    }
  ]
}

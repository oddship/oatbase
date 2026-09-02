{
  description = "Oatbase development environment";

  inputs.nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";

  outputs =
    { nixpkgs, ... }:
    let
      systems = [
        "aarch64-darwin"
        "aarch64-linux"
        "x86_64-linux"
      ];
      forAllSystems = nixpkgs.lib.genAttrs systems;
    in
    {
      devShells = forAllSystems (
        system:
        let
          pkgs = import nixpkgs { inherit system; };
          inherit (pkgs) lib;
        in
        {
          default = pkgs.mkShellNoCC {
            packages = [
              pkgs.bun
              pkgs.gnumake
              pkgs.nodejs_22
            ]
            ++ lib.optionals pkgs.stdenv.hostPlatform.isLinux [
              pkgs.playwright-driver.browsers
            ];

            shellHook = lib.optionalString pkgs.stdenv.hostPlatform.isLinux ''
              export PLAYWRIGHT_BROWSERS_PATH="${pkgs.playwright-driver.browsers}"
              export PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD="1"
              export PLAYWRIGHT_SKIP_VALIDATE_HOST_REQUIREMENTS="true"
              export LD_LIBRARY_PATH="${
                lib.makeLibraryPath [ pkgs.libglvnd ]
              }''${LD_LIBRARY_PATH:+:$LD_LIBRARY_PATH}"
              export GST_PLUGIN_PATH="${pkgs.gst_all_1.gst-libav}/lib/gstreamer-1.0''${GST_PLUGIN_PATH:+:$GST_PLUGIN_PATH}"
            '';
          };
        }
      );

      formatter = forAllSystems (
        system:
        let
          pkgs = import nixpkgs { inherit system; };
        in
        pkgs.nixfmt
      );
    };
}

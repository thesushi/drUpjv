<?php

/* themes/upjv/templates/page.html.twig */
class __TwigTemplate_888dff1ebaf8a3948aba820738dc5fd90cbe1b19a53c08ad08f3955076455fdd extends Twig_Template
{
    public function __construct(Twig_Environment $env)
    {
        parent::__construct($env);

        $this->parent = false;

        $this->blocks = array(
            'upjv_area' => array($this, 'block_upjv_area'),
            'navbar' => array($this, 'block_navbar'),
            'upjv_home' => array($this, 'block_upjv_home'),
            'upjv_slider' => array($this, 'block_upjv_slider'),
            'upjv_contact' => array($this, 'block_upjv_contact'),
            'upjv_info_bloc_actu' => array($this, 'block_upjv_info_bloc_actu'),
            'upjv_info_bloc_vous' => array($this, 'block_upjv_info_bloc_vous'),
            'upjv_info_bloc_zoom' => array($this, 'block_upjv_info_bloc_zoom'),
            'main' => array($this, 'block_main'),
            'content' => array($this, 'block_content'),
            'upjv_info_quatre_bloc_1' => array($this, 'block_upjv_info_quatre_bloc_1'),
            'upjv_info_quatre_bloc_2' => array($this, 'block_upjv_info_quatre_bloc_2'),
            'upjv_info_quatre_bloc_3' => array($this, 'block_upjv_info_quatre_bloc_3'),
            'upjv_info_quatre_bloc_4' => array($this, 'block_upjv_info_quatre_bloc_4'),
            'upjv_info_adr_bloc' => array($this, 'block_upjv_info_adr_bloc'),
            'upjv_pre_footer' => array($this, 'block_upjv_pre_footer'),
            'upjv_pre_footer_logo' => array($this, 'block_upjv_pre_footer_logo'),
            'footer' => array($this, 'block_footer'),
        );
    }

    protected function doDisplay(array $context, array $blocks = array())
    {
        $tags = array("set" => 65, "if" => 69, "block" => 70);
        $filters = array();
        $functions = array();

        try {
            $this->env->getExtension('sandbox')->checkSecurity(
                array('set', 'if', 'block'),
                array(),
                array()
            );
        } catch (Twig_Sandbox_SecurityError $e) {
            $e->setTemplateFile($this->getTemplateName());

            if ($e instanceof Twig_Sandbox_SecurityNotAllowedTagError && isset($tags[$e->getTagName()])) {
                $e->setTemplateLine($tags[$e->getTagName()]);
            } elseif ($e instanceof Twig_Sandbox_SecurityNotAllowedFilterError && isset($filters[$e->getFilterName()])) {
                $e->setTemplateLine($filters[$e->getFilterName()]);
            } elseif ($e instanceof Twig_Sandbox_SecurityNotAllowedFunctionError && isset($functions[$e->getFunctionName()])) {
                $e->setTemplateLine($functions[$e->getFunctionName()]);
            }

            throw $e;
        }

        // line 64
        echo "
    ";
        // line 65
        $context["container"] = (($this->getAttribute($this->getAttribute((isset($context["theme"]) ? $context["theme"] : null), "settings", array()), "fluid_container", array())) ? ("container-fluid") : ("container"));
        // line 66
        echo "
    <div id=\"page\">
        ";
        // line 69
        echo "        ";
        if ($this->getAttribute((isset($context["page"]) ? $context["page"] : null), "upjv_area", array())) {
            // line 70
            echo "        ";
            $this->displayBlock('upjv_area', $context, $blocks);
            // line 73
            echo "        ";
        }
        // line 74
        echo "
        ";
        // line 76
        echo "        ";
        if ($this->getAttribute((isset($context["page"]) ? $context["page"] : null), "navigation", array())) {
            // line 77
            echo "        ";
            $this->displayBlock('navbar', $context, $blocks);
            // line 87
            echo "        ";
        }
        // line 88
        echo "
        ";
        // line 90
        echo "        ";
        if ($this->getAttribute((isset($context["page"]) ? $context["page"] : null), "upjv_home", array())) {
            // line 91
            echo "        ";
            $this->displayBlock('upjv_home', $context, $blocks);
            // line 96
            echo "        ";
        }
        // line 97
        echo "
        ";
        // line 99
        echo "        ";
        if ($this->getAttribute((isset($context["page"]) ? $context["page"] : null), "upjv_slider", array())) {
            // line 100
            echo "        ";
            $this->displayBlock('upjv_slider', $context, $blocks);
            // line 104
            echo "        ";
        }
        // line 105
        echo "
        ";
        // line 107
        echo "        ";
        if ($this->getAttribute((isset($context["page"]) ? $context["page"] : null), "upjv_contact", array())) {
            // line 108
            echo "        ";
            $this->displayBlock('upjv_contact', $context, $blocks);
            // line 111
            echo "        ";
        }
        // line 112
        echo "


        ";
        // line 116
        echo "        ";
        if ($this->getAttribute((isset($context["page"]) ? $context["page"] : null), "upjv_info_bloc_actu", array())) {
            // line 117
            echo "
        <div id=\"page_deco\">
            <div id=\"contenu_sans_nav_sans_encadres\" class=\"contenu\">
                <div>
                    <div class=\"ligne_1\">

                        ";
            // line 123
            $this->displayBlock('upjv_info_bloc_actu', $context, $blocks);
            // line 169
            echo "                ";
        }
        // line 170
        echo "
                ";
        // line 172
        echo "                ";
        if ($this->getAttribute((isset($context["page"]) ? $context["page"] : null), "upjv_info_bloc_vous", array())) {
            // line 173
            echo "
                ";
            // line 174
            if ( !$this->getAttribute((isset($context["page"]) ? $context["page"] : null), "upjv_info_bloc_actu", array())) {
                // line 175
                echo "                <div id=\"page_deco\">
                    <div id=\"contenu_sans_nav_sans_encadres\" class=\"contenu\">
                        <div>
                            <div class=\"ligne_1\">
                                ";
            }
            // line 180
            echo "
                                ";
            // line 181
            $this->displayBlock('upjv_info_bloc_vous', $context, $blocks);
            // line 195
            echo "                                    ";
        }
        // line 196
        echo "
                                    ";
        // line 198
        echo "                                    ";
        if ($this->getAttribute((isset($context["page"]) ? $context["page"] : null), "upjv_info_bloc_zoom", array())) {
            // line 199
            echo "
                                    ";
            // line 200
            if (( !$this->getAttribute((isset($context["page"]) ? $context["page"] : null), "upjv_info_bloc_actu", array()) &&  !$this->getAttribute((isset($context["page"]) ? $context["page"] : null), "upjv_info_bloc_vous", array()))) {
                // line 201
                echo "                                    <div id=\"page_deco\">
                                        <div id=\"contenu_sans_nav_sans_encadres\" class=\"contenu\">
                                            <div>
                                                <div class=\"ligne_1\">
                                                    ";
            }
            // line 206
            echo "
                                                    ";
            // line 207
            $this->displayBlock('upjv_info_bloc_zoom', $context, $blocks);
            // line 220
            echo "                                                        ";
        }
        // line 221
        echo "


                                                        ";
        // line 224
        if ($this->getAttribute((isset($context["page"]) ? $context["page"] : null), "upjv_info_bloc_actu", array())) {
            // line 225
            echo "
                                                    </div>
                                                </div>
                                            </div>

                                        </div>
                                        ";
        } elseif ($this->getAttribute(        // line 231
(isset($context["page"]) ? $context["page"] : null), "upjv_info_bloc_vous", array())) {
            // line 232
            echo "                                    </div>
                                </div>
                            </div>

                        </div>
                        ";
        } elseif ($this->getAttribute(        // line 237
(isset($context["page"]) ? $context["page"] : null), "upjv_info_bloc_zoom", array())) {
            // line 238
            echo "                    </div>
                </div>
            </div>

        </div>
        ";
        }
        // line 244
        echo "

        ";
        // line 247
        echo "        ";
        $this->displayBlock('main', $context, $blocks);
        // line 256
        echo "

        ";
        // line 258
        if (((($this->getAttribute((isset($context["page"]) ? $context["page"] : null), "upjv_info_quatre_bloc_1", array()) || $this->getAttribute((isset($context["page"]) ? $context["page"] : null), "upjv_info_quatre_bloc_2", array())) || $this->getAttribute((isset($context["page"]) ? $context["page"] : null), "upjv_info_quatre_bloc_3", array())) || $this->getAttribute((isset($context["page"]) ? $context["page"] : null), "upjv_info_quatre_bloc_4", array()))) {
            // line 259
            echo "        <div class=\"ligne_2\">
            ";
        }
        // line 261
        echo "
            ";
        // line 263
        echo "            ";
        if ($this->getAttribute((isset($context["page"]) ? $context["page"] : null), "upjv_info_quatre_bloc_1", array())) {
            // line 264
            echo "            ";
            $this->displayBlock('upjv_info_quatre_bloc_1', $context, $blocks);
            // line 276
            echo "            ";
        }
        // line 277
        echo "

            ";
        // line 280
        echo "            ";
        if ($this->getAttribute((isset($context["page"]) ? $context["page"] : null), "upjv_info_quatre_bloc_2", array())) {
            // line 281
            echo "            ";
            $this->displayBlock('upjv_info_quatre_bloc_2', $context, $blocks);
            // line 290
            echo "                ";
        }
        // line 291
        echo "

                ";
        // line 294
        echo "                ";
        if ($this->getAttribute((isset($context["page"]) ? $context["page"] : null), "upjv_info_quatre_bloc_3", array())) {
            // line 295
            echo "                ";
            $this->displayBlock('upjv_info_quatre_bloc_3', $context, $blocks);
            // line 303
            echo "                    ";
        }
        // line 304
        echo "


                    ";
        // line 308
        echo "                    ";
        if ($this->getAttribute((isset($context["page"]) ? $context["page"] : null), "upjv_info_quatre_bloc_4", array())) {
            // line 309
            echo "                    ";
            $this->displayBlock('upjv_info_quatre_bloc_4', $context, $blocks);
            // line 321
            echo "                        ";
        }
        // line 322
        echo "

                        ";
        // line 324
        if (((($this->getAttribute((isset($context["page"]) ? $context["page"] : null), "upjv_info_quatre_bloc_1", array()) || $this->getAttribute((isset($context["page"]) ? $context["page"] : null), "upjv_info_quatre_bloc_2", array())) || $this->getAttribute((isset($context["page"]) ? $context["page"] : null), "upjv_info_quatre_bloc_3", array())) || $this->getAttribute((isset($context["page"]) ? $context["page"] : null), "upjv_info_quatre_bloc_4", array()))) {
            // line 325
            echo "                    </div>
                    ";
        }
        // line 327
        echo "
                    ";
        // line 329
        echo "                    ";
        if ($this->getAttribute((isset($context["page"]) ? $context["page"] : null), "upjv_info_adr_bloc", array())) {
            // line 330
            echo "                    ";
            $this->displayBlock('upjv_info_adr_bloc', $context, $blocks);
            // line 333
            echo "                    ";
        }
        // line 334
        echo "
                </div>
                <hr class=\"separateur_sections_page\">

                <div id=\"pied_page\">


                    ";
        // line 342
        echo "                    ";
        if ($this->getAttribute((isset($context["page"]) ? $context["page"] : null), "upjv_pre_footer", array())) {
            // line 343
            echo "                    ";
            $this->displayBlock('upjv_pre_footer', $context, $blocks);
            // line 351
            echo "                    ";
        }
        // line 352
        echo "



                        ";
        // line 357
        echo "                        ";
        if ($this->getAttribute((isset($context["page"]) ? $context["page"] : null), "upjv_pre_footer_logo", array())) {
            // line 358
            echo "                            ";
            $this->displayBlock('upjv_pre_footer_logo', $context, $blocks);
            // line 366
            echo "                        ";
        }
        // line 367
        echo "



                    ";
        // line 371
        if ($this->getAttribute((isset($context["page"]) ? $context["page"] : null), "footer", array())) {
            // line 372
            echo "                    ";
            $this->displayBlock('footer', $context, $blocks);
            // line 377
            echo "                    ";
        }
        // line 378
        echo "                    <div id=\"pied_page_retour\">
                        <a href=\"#page\"><span aria-hidden=\"true\" class=\"fa fa-arrow-up\"></span> Haut de page</a>
                    </div><!-- #retour_debut_ecran -->
                </div>";
    }

    // line 70
    public function block_upjv_area($context, array $blocks = array())
    {
        // line 71
        echo "        ";
        echo $this->env->getExtension('sandbox')->ensureToStringAllowed($this->env->getExtension('drupal_core')->escapeFilter($this->env, $this->getAttribute((isset($context["page"]) ? $context["page"] : null), "upjv_area", array()), "html", null, true));
        echo "
        ";
    }

    // line 77
    public function block_navbar($context, array $blocks = array())
    {
        // line 78
        echo "
        ";
        // line 80
        echo "        ";
        if ($this->getAttribute((isset($context["page"]) ? $context["page"] : null), "navigation_collapsible", array())) {
            // line 81
            echo "
        ";
            // line 82
            echo $this->env->getExtension('sandbox')->ensureToStringAllowed($this->env->getExtension('drupal_core')->escapeFilter($this->env, $this->getAttribute((isset($context["page"]) ? $context["page"] : null), "navigation_collapsible", array()), "html", null, true));
            echo "

        ";
        }
        // line 85
        echo "
        ";
    }

    // line 91
    public function block_upjv_home($context, array $blocks = array())
    {
        // line 92
        echo "        <div class=\"upjv_home container\">
            <div class=\"style_3 centeredText\">";
        // line 93
        echo $this->env->getExtension('sandbox')->ensureToStringAllowed($this->env->getExtension('drupal_core')->escapeFilter($this->env, $this->getAttribute((isset($context["page"]) ? $context["page"] : null), "upjv_home", array()), "html", null, true));
        echo "</div>
        </div>
        ";
    }

    // line 100
    public function block_upjv_slider($context, array $blocks = array())
    {
        // line 101
        echo "        <div class=\"upjv_slider container\">";
        echo $this->env->getExtension('sandbox')->ensureToStringAllowed($this->env->getExtension('drupal_core')->escapeFilter($this->env, $this->getAttribute((isset($context["page"]) ? $context["page"] : null), "upjv_slider", array()), "html", null, true));
        echo "</div>
        <div class=\"clearfix\"></div>
        ";
    }

    // line 108
    public function block_upjv_contact($context, array $blocks = array())
    {
        // line 109
        echo "        <div class=\"upjv_contact container\">";
        echo $this->env->getExtension('sandbox')->ensureToStringAllowed($this->env->getExtension('drupal_core')->escapeFilter($this->env, $this->getAttribute((isset($context["page"]) ? $context["page"] : null), "upjv_contact", array()), "html", null, true));
        echo "</div>
        ";
    }

    // line 123
    public function block_upjv_info_bloc_actu($context, array $blocks = array())
    {
        // line 124
        echo "
                        <div class=\"colonne_1\">

                            <div class=\"colonne_deco\">
                                <div class=\"style_2\">
                                    <h2><span>Actualités</span></h2>

                                    <div class=\"toolbox\">
                                        <div class=\"onglets multiples ui-tabs ui-widget ui-widget-content ui-corner-all\">
                                            <ul class=\"ui-tabs-nav ui-helper-reset ui-helper-clearfix ui-widget-header ui-corner-all\"
                                            role=\"tablist\">
                                            <li aria-controls=\"onglet_1575174376000153165\" aria-labelledby=\"ui-id-4\"
                                            aria-selected=\"true\"
                                            class=\"ui-state-default ui-corner-top ui-tabs-active ui-state-active\"
                                            role=\"tab\" tabindex=\"0\"><a class=\"ui-tabs-anchor\"
                                            href=\"#onglet_1575174376000153165\"
                                            id=\"ui-id-4\" role=\"presentation\"
                                            tabindex=\"-1\">La Une</a></li>
                                        </ul>

                                        <div aria-expanded=\"true\" aria-hidden=\"false\" aria-labelledby=\"ui-id-4\"
                                        class=\"ui-tabs-panel ui-widget-content ui-corner-bottom\"
                                        id=\"onglet_1575174376000153165\" role=\"tabpanel\">


                                        <ul class=\"objets actualites\">
                                            ";
        // line 150
        echo $this->env->getExtension('sandbox')->ensureToStringAllowed($this->env->getExtension('drupal_core')->escapeFilter($this->env, $this->getAttribute((isset($context["page"]) ? $context["page"] : null), "upjv_info_bloc_actu", array()), "html", null, true));
        echo "
                                        </ul>

                                    </div>
                                </div>
                            </div>


                            <div>

                            </div>

                        </div>


                    </div>
                </div>

                ";
    }

    // line 181
    public function block_upjv_info_bloc_vous($context, array $blocks = array())
    {
        // line 182
        echo "                                <div class=\"colonne_2\">

                                    <div class=\"colonne_deco\">
                                        <div class=\"style_2\">
                                            <h2><span>VOUS ÊTES</span></h2>


                                            ";
        // line 189
        echo $this->env->getExtension('sandbox')->ensureToStringAllowed($this->env->getExtension('drupal_core')->escapeFilter($this->env, $this->getAttribute((isset($context["page"]) ? $context["page"] : null), "upjv_info_bloc_vous", array()), "html", null, true));
        echo "


                                        </div><!-- .style_2 --></div>
                                    </div>
                                    ";
    }

    // line 207
    public function block_upjv_info_bloc_zoom($context, array $blocks = array())
    {
        // line 208
        echo "                                                    <div class=\"colonne_3\">

                                                        <div class=\"colonne_deco\">
                                                            <div class=\"style_2\">
                                                                <h2><span>Zoom sur</span></h2>
                                                                <div class=\"toolbox\">
                                                                    ";
        // line 214
        echo $this->env->getExtension('sandbox')->ensureToStringAllowed($this->env->getExtension('drupal_core')->escapeFilter($this->env, $this->getAttribute((isset($context["page"]) ? $context["page"] : null), "upjv_info_bloc_zoom", array()), "html", null, true));
        echo "
                                                                </div><!-- .toolbox -->
                                                            </div><!-- .style_2 --></div>

                                                        </div>
                                                        ";
    }

    // line 247
    public function block_main($context, array $blocks = array())
    {
        // line 248
        echo "        <div role=\"main\" class=\"main-container ";
        echo $this->env->getExtension('sandbox')->ensureToStringAllowed($this->env->getExtension('drupal_core')->escapeFilter($this->env, (isset($context["container"]) ? $context["container"] : null), "html", null, true));
        echo " js-quickedit-main-content\">
            ";
        // line 250
        echo "            ";
        $this->displayBlock('content', $context, $blocks);
        // line 253
        echo "            
        </div>
        ";
    }

    // line 250
    public function block_content($context, array $blocks = array())
    {
        // line 251
        echo "            ";
        echo $this->env->getExtension('sandbox')->ensureToStringAllowed($this->env->getExtension('drupal_core')->escapeFilter($this->env, $this->getAttribute((isset($context["page"]) ? $context["page"] : null), "content", array()), "html", null, true));
        echo "
            ";
    }

    // line 264
    public function block_upjv_info_quatre_bloc_1($context, array $blocks = array())
    {
        // line 265
        echo "
            <div class=\"colonne_1\">
                <div class=\"colonne_deco\">
                    <div class=\"style_3\">
                        ";
        // line 269
        echo $this->env->getExtension('sandbox')->ensureToStringAllowed($this->env->getExtension('drupal_core')->escapeFilter($this->env, $this->getAttribute((isset($context["page"]) ? $context["page"] : null), "upjv_info_quatre_bloc_1", array()), "html", null, true));
        echo "
                    </div><!-- .style_3 -->
                </div><!-- colonne_deco -->

            </div>
            <!-- .colonne_1 -->
            ";
    }

    // line 281
    public function block_upjv_info_quatre_bloc_2($context, array $blocks = array())
    {
        // line 282
        echo "

            <div class=\"colonne_2\">
                <div class=\"colonne_deco\">
                    <div class=\"style_0\">  ";
        // line 286
        echo $this->env->getExtension('sandbox')->ensureToStringAllowed($this->env->getExtension('drupal_core')->escapeFilter($this->env, $this->getAttribute((isset($context["page"]) ? $context["page"] : null), "upjv_info_quatre_bloc_2", array()), "html", null, true));
        echo "
                    </div><!-- .style_0 --></div><!-- colonne_deco -->
                </div><!-- .colonne_2 -->
                ";
    }

    // line 295
    public function block_upjv_info_quatre_bloc_3($context, array $blocks = array())
    {
        // line 296
        echo "                <div class=\"colonne_3\">
                    <div class=\"colonne_deco\">
                        <div class=\"style_3\">  ";
        // line 298
        echo $this->env->getExtension('sandbox')->ensureToStringAllowed($this->env->getExtension('drupal_core')->escapeFilter($this->env, $this->getAttribute((isset($context["page"]) ? $context["page"] : null), "upjv_info_quatre_bloc_3", array()), "html", null, true));
        echo "
                        </div><!-- .style_3 --></div><!-- colonne_deco -->
                    </div><!-- .colonne_3 -->

                    ";
    }

    // line 309
    public function block_upjv_info_quatre_bloc_4($context, array $blocks = array())
    {
        // line 310
        echo "


                    <div class=\"colonne_4\">
                        <div class=\"colonne_deco\">
                            <div class=\"style_3\">
                                ";
        // line 316
        echo $this->env->getExtension('sandbox')->ensureToStringAllowed($this->env->getExtension('drupal_core')->escapeFilter($this->env, $this->getAttribute((isset($context["page"]) ? $context["page"] : null), "upjv_info_quatre_bloc_4", array()), "html", null, true));
        echo "
                            </div><!-- .style_3 --></div><!-- colonne_deco -->
                        </div><!-- .colonne_4 -->

                        ";
    }

    // line 330
    public function block_upjv_info_adr_bloc($context, array $blocks = array())
    {
        // line 331
        echo "                    <div class=\"upjv_info_adr_bloc container\"><hr>";
        echo $this->env->getExtension('sandbox')->ensureToStringAllowed($this->env->getExtension('drupal_core')->escapeFilter($this->env, $this->getAttribute((isset($context["page"]) ? $context["page"] : null), "upjv_info_adr_bloc", array()), "html", null, true));
        echo "</div>
                    ";
    }

    // line 343
    public function block_upjv_pre_footer($context, array $blocks = array())
    {
        // line 344
        echo "
                    <div id=\"pied_page_rubriques\">

                        ";
        // line 347
        echo $this->env->getExtension('sandbox')->ensureToStringAllowed($this->env->getExtension('drupal_core')->escapeFilter($this->env, $this->getAttribute((isset($context["page"]) ? $context["page"] : null), "upjv_pre_footer", array()), "html", null, true));
        echo "
                    </div>

                    ";
    }

    // line 358
    public function block_upjv_pre_footer_logo($context, array $blocks = array())
    {
        // line 359
        echo "
                        
                        ";
        // line 361
        echo $this->env->getExtension('sandbox')->ensureToStringAllowed($this->env->getExtension('drupal_core')->escapeFilter($this->env, $this->getAttribute((isset($context["page"]) ? $context["page"] : null), "upjv_pre_footer_logo", array()), "html", null, true));
        echo "
                        


                            ";
    }

    // line 372
    public function block_footer($context, array $blocks = array())
    {
        // line 373
        echo "                    <footer class=\"footer ";
        echo $this->env->getExtension('sandbox')->ensureToStringAllowed($this->env->getExtension('drupal_core')->escapeFilter($this->env, (isset($context["container"]) ? $context["container"] : null), "html", null, true));
        echo "\" role=\"contentinfo\">
                        ";
        // line 374
        echo $this->env->getExtension('sandbox')->ensureToStringAllowed($this->env->getExtension('drupal_core')->escapeFilter($this->env, $this->getAttribute((isset($context["page"]) ? $context["page"] : null), "footer", array()), "html", null, true));
        echo "
                    </footer>
                    ";
    }

    public function getTemplateName()
    {
        return "themes/upjv/templates/page.html.twig";
    }

    public function isTraitable()
    {
        return false;
    }

    public function getDebugInfo()
    {
        return array (  693 => 374,  688 => 373,  685 => 372,  676 => 361,  672 => 359,  669 => 358,  661 => 347,  656 => 344,  653 => 343,  646 => 331,  643 => 330,  634 => 316,  626 => 310,  623 => 309,  614 => 298,  610 => 296,  607 => 295,  599 => 286,  593 => 282,  590 => 281,  579 => 269,  573 => 265,  570 => 264,  563 => 251,  560 => 250,  554 => 253,  551 => 250,  546 => 248,  543 => 247,  533 => 214,  525 => 208,  522 => 207,  512 => 189,  503 => 182,  500 => 181,  477 => 150,  449 => 124,  446 => 123,  439 => 109,  436 => 108,  428 => 101,  425 => 100,  418 => 93,  415 => 92,  412 => 91,  407 => 85,  401 => 82,  398 => 81,  395 => 80,  392 => 78,  389 => 77,  382 => 71,  379 => 70,  372 => 378,  369 => 377,  366 => 372,  364 => 371,  358 => 367,  355 => 366,  352 => 358,  349 => 357,  343 => 352,  340 => 351,  337 => 343,  334 => 342,  325 => 334,  322 => 333,  319 => 330,  316 => 329,  313 => 327,  309 => 325,  307 => 324,  303 => 322,  300 => 321,  297 => 309,  294 => 308,  289 => 304,  286 => 303,  283 => 295,  280 => 294,  276 => 291,  273 => 290,  270 => 281,  267 => 280,  263 => 277,  260 => 276,  257 => 264,  254 => 263,  251 => 261,  247 => 259,  245 => 258,  241 => 256,  238 => 247,  234 => 244,  226 => 238,  224 => 237,  217 => 232,  215 => 231,  207 => 225,  205 => 224,  200 => 221,  197 => 220,  195 => 207,  192 => 206,  185 => 201,  183 => 200,  180 => 199,  177 => 198,  174 => 196,  171 => 195,  169 => 181,  166 => 180,  159 => 175,  157 => 174,  154 => 173,  151 => 172,  148 => 170,  145 => 169,  143 => 123,  135 => 117,  132 => 116,  127 => 112,  124 => 111,  121 => 108,  118 => 107,  115 => 105,  112 => 104,  109 => 100,  106 => 99,  103 => 97,  100 => 96,  97 => 91,  94 => 90,  91 => 88,  88 => 87,  85 => 77,  82 => 76,  79 => 74,  76 => 73,  73 => 70,  70 => 69,  66 => 66,  64 => 65,  61 => 64,);
    }
}
/* {#*/
/*     /***/
/*     * @file*/
/*     * Default theme implementation to display a single page.*/
/*     **/
/*     * The doctype, html, head and body tags are not in this template. Instead they*/
/*     * can be found in the html.html.twig template in this directory.*/
/*     **/
/*     * Available variables:*/
/*     **/
/*     * General utility variables:*/
/*     * - base_path: The base URL path of the Drupal installation. Will usually be*/
/*     *   "/" unless you have installed Drupal in a sub-directory.*/
/*     * - is_front: A flag indicating if the current page is the front page.*/
/*     * - logged_in: A flag indicating if the user is registered and signed in.*/
/*     * - is_admin: A flag indicating if the user has permission to access*/
/*     *   administration pages.*/
/*     **/
/*     * Site identity:*/
/*     * - front_page: The URL of the front page. Use this instead of base_path when*/
/*     *   linking to the front page. This includes the language domain or prefix.*/
/*     * - logo: The url of the logo image, as defined in theme settings.*/
/*     * - site_name: The name of the site. This is empty when displaying the site*/
/*     *   name has been disabled in the theme settings.*/
/*     * - site_slogan: The slogan of the site. This is empty when displaying the site*/
/*     *   slogan has been disabled in theme settings.*/
/*     **/
/*     * Navigation:*/
/*     * - breadcrumb: The breadcrumb trail for the current page.*/
/*     **/
/*     * Page content (in order of occurrence in the default page.html.twig):*/
/*     * - title_prefix: Additional output populated by modules, intended to be*/
/*     *   displayed in front of the main title tag that appears in the template.*/
/*     * - title: The page title, for use in the actual content.*/
/*     * - title_suffix: Additional output populated by modules, intended to be*/
/*     *   displayed after the main title tag that appears in the template.*/
/*     * - messages: Status and error messages. Should be displayed prominently.*/
/*     * - tabs: Tabs linking to any sub-pages beneath the current page (e.g., the*/
/*     *   view and edit tabs when displaying a node).*/
/*     * - action_links: Actions local to the page, such as "Add menu" on the menu*/
/*     *   administration interface.*/
/*     * - node: Fully loaded node, if there is an automatically-loaded node*/
/*     *   associated with the page and the node ID is the second argument in the*/
/*     *   page's path (e.g. node/12345 and node/12345/revisions, but not*/
/*     *   comment/reply/12345).*/
/*     **/
/*     * Regions:*/
/*     * - page.header: Items for the header region.*/
/*     * - page.primary_menu: Items for the primary menu region.*/
/*     * - page.secondary_menu: Items for the secondary menu region.*/
/*     * - page.highlighted: Items for the highlighted content region.*/
/*     * - page.help: Dynamic help text, mostly for admin pages.*/
/*     * - page.content: The main content of the current page.*/
/*     * - page.sidebar_first: Items for the first sidebar.*/
/*     * - page.sidebar_second: Items for the second sidebar.*/
/*     * - page.footer: Items for the footer region.*/
/*     **/
/*     * @see template_preprocess_page()*/
/*     * @see html.html.twig*/
/*     **/
/*     * @ingroup templates*/
/*     *//* */
/*     #}*/
/* */
/*     {% set container = theme.settings.fluid_container ? 'container-fluid' : 'container' %}*/
/* */
/*     <div id="page">*/
/*         {# UPJV AREA #}*/
/*         {% if page.upjv_area %}*/
/*         {% block upjv_area %}*/
/*         {{ page.upjv_area }}*/
/*         {% endblock %}*/
/*         {% endif %}*/
/* */
/*         {# Navbar #}*/
/*         {% if page.navigation %}*/
/*         {% block navbar %}*/
/* */
/*         {# Navigation (collapsible) #}*/
/*         {% if page.navigation_collapsible %}*/
/* */
/*         {{ page.navigation_collapsible }}*/
/* */
/*         {% endif %}*/
/* */
/*         {% endblock %}*/
/*         {% endif %}*/
/* */
/*         {# UPJV HOME #}*/
/*         {% if page.upjv_home %}*/
/*         {% block upjv_home %}*/
/*         <div class="upjv_home container">*/
/*             <div class="style_3 centeredText">{{ page.upjv_home }}</div>*/
/*         </div>*/
/*         {% endblock %}*/
/*         {% endif %}*/
/* */
/*         {# UPJV SLIDER #}*/
/*         {% if page.upjv_slider %}*/
/*         {% block upjv_slider %}*/
/*         <div class="upjv_slider container">{{ page.upjv_slider }}</div>*/
/*         <div class="clearfix"></div>*/
/*         {% endblock %}*/
/*         {% endif %}*/
/* */
/*         {# UPJV CONTACT #}*/
/*         {% if page.upjv_contact %}*/
/*         {% block upjv_contact %}*/
/*         <div class="upjv_contact container">{{ page.upjv_contact }}</div>*/
/*         {% endblock %}*/
/*         {% endif %}*/
/* */
/* */
/* */
/*         {# UPJV INFO BLOC Actu #}*/
/*         {% if page.upjv_info_bloc_actu %}*/
/* */
/*         <div id="page_deco">*/
/*             <div id="contenu_sans_nav_sans_encadres" class="contenu">*/
/*                 <div>*/
/*                     <div class="ligne_1">*/
/* */
/*                         {% block upjv_info_bloc_actu %}*/
/* */
/*                         <div class="colonne_1">*/
/* */
/*                             <div class="colonne_deco">*/
/*                                 <div class="style_2">*/
/*                                     <h2><span>Actualités</span></h2>*/
/* */
/*                                     <div class="toolbox">*/
/*                                         <div class="onglets multiples ui-tabs ui-widget ui-widget-content ui-corner-all">*/
/*                                             <ul class="ui-tabs-nav ui-helper-reset ui-helper-clearfix ui-widget-header ui-corner-all"*/
/*                                             role="tablist">*/
/*                                             <li aria-controls="onglet_1575174376000153165" aria-labelledby="ui-id-4"*/
/*                                             aria-selected="true"*/
/*                                             class="ui-state-default ui-corner-top ui-tabs-active ui-state-active"*/
/*                                             role="tab" tabindex="0"><a class="ui-tabs-anchor"*/
/*                                             href="#onglet_1575174376000153165"*/
/*                                             id="ui-id-4" role="presentation"*/
/*                                             tabindex="-1">La Une</a></li>*/
/*                                         </ul>*/
/* */
/*                                         <div aria-expanded="true" aria-hidden="false" aria-labelledby="ui-id-4"*/
/*                                         class="ui-tabs-panel ui-widget-content ui-corner-bottom"*/
/*                                         id="onglet_1575174376000153165" role="tabpanel">*/
/* */
/* */
/*                                         <ul class="objets actualites">*/
/*                                             {{ page.upjv_info_bloc_actu }}*/
/*                                         </ul>*/
/* */
/*                                     </div>*/
/*                                 </div>*/
/*                             </div>*/
/* */
/* */
/*                             <div>*/
/* */
/*                             </div>*/
/* */
/*                         </div>*/
/* */
/* */
/*                     </div>*/
/*                 </div>*/
/* */
/*                 {% endblock %}*/
/*                 {% endif %}*/
/* */
/*                 {# UPJV INFO BLOC Vous etes #}*/
/*                 {% if page.upjv_info_bloc_vous %}*/
/* */
/*                 {% if not page.upjv_info_bloc_actu %}*/
/*                 <div id="page_deco">*/
/*                     <div id="contenu_sans_nav_sans_encadres" class="contenu">*/
/*                         <div>*/
/*                             <div class="ligne_1">*/
/*                                 {% endif %}*/
/* */
/*                                 {% block upjv_info_bloc_vous %}*/
/*                                 <div class="colonne_2">*/
/* */
/*                                     <div class="colonne_deco">*/
/*                                         <div class="style_2">*/
/*                                             <h2><span>VOUS ÊTES</span></h2>*/
/* */
/* */
/*                                             {{ page.upjv_info_bloc_vous }}*/
/* */
/* */
/*                                         </div><!-- .style_2 --></div>*/
/*                                     </div>*/
/*                                     {% endblock %}*/
/*                                     {% endif %}*/
/* */
/*                                     {# UPJV INFO BLOC Zoom #}*/
/*                                     {% if page.upjv_info_bloc_zoom %}*/
/* */
/*                                     {% if not page.upjv_info_bloc_actu and not page.upjv_info_bloc_vous %}*/
/*                                     <div id="page_deco">*/
/*                                         <div id="contenu_sans_nav_sans_encadres" class="contenu">*/
/*                                             <div>*/
/*                                                 <div class="ligne_1">*/
/*                                                     {% endif %}*/
/* */
/*                                                     {% block upjv_info_bloc_zoom %}*/
/*                                                     <div class="colonne_3">*/
/* */
/*                                                         <div class="colonne_deco">*/
/*                                                             <div class="style_2">*/
/*                                                                 <h2><span>Zoom sur</span></h2>*/
/*                                                                 <div class="toolbox">*/
/*                                                                     {{ page.upjv_info_bloc_zoom }}*/
/*                                                                 </div><!-- .toolbox -->*/
/*                                                             </div><!-- .style_2 --></div>*/
/* */
/*                                                         </div>*/
/*                                                         {% endblock %}*/
/*                                                         {% endif %}*/
/* */
/* */
/* */
/*                                                         {% if page.upjv_info_bloc_actu %}*/
/* */
/*                                                     </div>*/
/*                                                 </div>*/
/*                                             </div>*/
/* */
/*                                         </div>*/
/*                                         {% elseif page.upjv_info_bloc_vous %}*/
/*                                     </div>*/
/*                                 </div>*/
/*                             </div>*/
/* */
/*                         </div>*/
/*                         {% elseif page.upjv_info_bloc_zoom %}*/
/*                     </div>*/
/*                 </div>*/
/*             </div>*/
/* */
/*         </div>*/
/*         {% endif %}*/
/* */
/* */
/*         {# Main #}*/
/*         {% block main %}*/
/*         <div role="main" class="main-container {{ container }} js-quickedit-main-content">*/
/*             {# Content #}*/
/*             {% block content %}*/
/*             {{ page.content }}*/
/*             {% endblock %}*/
/*             */
/*         </div>*/
/*         {% endblock %}*/
/* */
/* */
/*         {% if page.upjv_info_quatre_bloc_1 or page.upjv_info_quatre_bloc_2 or page.upjv_info_quatre_bloc_3 or page.upjv_info_quatre_bloc_4 %}*/
/*         <div class="ligne_2">*/
/*             {% endif %}*/
/* */
/*             {# UPJV 4 BLOCS #}*/
/*             {% if page.upjv_info_quatre_bloc_1 %}*/
/*             {% block upjv_info_quatre_bloc_1 %}*/
/* */
/*             <div class="colonne_1">*/
/*                 <div class="colonne_deco">*/
/*                     <div class="style_3">*/
/*                         {{ page.upjv_info_quatre_bloc_1 }}*/
/*                     </div><!-- .style_3 -->*/
/*                 </div><!-- colonne_deco -->*/
/* */
/*             </div>*/
/*             <!-- .colonne_1 -->*/
/*             {% endblock %}*/
/*             {% endif %}*/
/* */
/* */
/*             {# UPJV 4 BLOCS #}*/
/*             {% if page.upjv_info_quatre_bloc_2 %}*/
/*             {% block upjv_info_quatre_bloc_2 %}*/
/* */
/* */
/*             <div class="colonne_2">*/
/*                 <div class="colonne_deco">*/
/*                     <div class="style_0">  {{ page.upjv_info_quatre_bloc_2 }}*/
/*                     </div><!-- .style_0 --></div><!-- colonne_deco -->*/
/*                 </div><!-- .colonne_2 -->*/
/*                 {% endblock %}*/
/*                 {% endif %}*/
/* */
/* */
/*                 {# UPJV 4 BLOCS #}*/
/*                 {% if page.upjv_info_quatre_bloc_3 %}*/
/*                 {% block upjv_info_quatre_bloc_3 %}*/
/*                 <div class="colonne_3">*/
/*                     <div class="colonne_deco">*/
/*                         <div class="style_3">  {{ page.upjv_info_quatre_bloc_3 }}*/
/*                         </div><!-- .style_3 --></div><!-- colonne_deco -->*/
/*                     </div><!-- .colonne_3 -->*/
/* */
/*                     {% endblock %}*/
/*                     {% endif %}*/
/* */
/* */
/* */
/*                     {# UPJV 4 BLOCS #}*/
/*                     {% if page.upjv_info_quatre_bloc_4 %}*/
/*                     {% block upjv_info_quatre_bloc_4 %}*/
/* */
/* */
/* */
/*                     <div class="colonne_4">*/
/*                         <div class="colonne_deco">*/
/*                             <div class="style_3">*/
/*                                 {{ page.upjv_info_quatre_bloc_4 }}*/
/*                             </div><!-- .style_3 --></div><!-- colonne_deco -->*/
/*                         </div><!-- .colonne_4 -->*/
/* */
/*                         {% endblock %}*/
/*                         {% endif %}*/
/* */
/* */
/*                         {% if page.upjv_info_quatre_bloc_1 or page.upjv_info_quatre_bloc_2 or page.upjv_info_quatre_bloc_3 or page.upjv_info_quatre_bloc_4 %}*/
/*                     </div>*/
/*                     {% endif %}*/
/* */
/*                     {# UPJV INFO ADRESSE #}*/
/*                     {% if page.upjv_info_adr_bloc %}*/
/*                     {% block upjv_info_adr_bloc %}*/
/*                     <div class="upjv_info_adr_bloc container"><hr>{{ page.upjv_info_adr_bloc }}</div>*/
/*                     {% endblock %}*/
/*                     {% endif %}*/
/* */
/*                 </div>*/
/*                 <hr class="separateur_sections_page">*/
/* */
/*                 <div id="pied_page">*/
/* */
/* */
/*                     {# UPJV PRE FOOTER #}*/
/*                     {% if page.upjv_pre_footer %}*/
/*                     {% block upjv_pre_footer %}*/
/* */
/*                     <div id="pied_page_rubriques">*/
/* */
/*                         {{ page.upjv_pre_footer }}*/
/*                     </div>*/
/* */
/*                     {% endblock %}*/
/*                     {% endif %}*/
/* */
/* */
/* */
/* */
/*                         {# UPJV PRE FOOTER logo #}*/
/*                         {% if page.upjv_pre_footer_logo %}*/
/*                             {% block upjv_pre_footer_logo %}*/
/* */
/*                         */
/*                         {{ page.upjv_pre_footer_logo }}*/
/*                         */
/* */
/* */
/*                             {% endblock %}*/
/*                         {% endif %}*/
/* */
/* */
/* */
/* */
/*                     {% if page.footer %}*/
/*                     {% block footer %}*/
/*                     <footer class="footer {{ container }}" role="contentinfo">*/
/*                         {{ page.footer }}*/
/*                     </footer>*/
/*                     {% endblock %}*/
/*                     {% endif %}*/
/*                     <div id="pied_page_retour">*/
/*                         <a href="#page"><span aria-hidden="true" class="fa fa-arrow-up"></span> Haut de page</a>*/
/*                     </div><!-- #retour_debut_ecran -->*/
/*                 </div>*/

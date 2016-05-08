<?php

/* themes/upjv/templates/node--deux_col_plus.html.twig */
class __TwigTemplate_4dd3972f8b6961a9c3c482b2f272a5bf57b73d7f7d79e2394ff05bed9107f8f0 extends Twig_Template
{
    public function __construct(Twig_Environment $env)
    {
        parent::__construct($env);

        $this->parent = false;

        $this->blocks = array(
            'upjv_menu_n' => array($this, 'block_upjv_menu_n'),
        );
    }

    protected function doDisplay(array $context, array $blocks = array())
    {
        $tags = array("if" => 1, "block" => 135);
        $filters = array();
        $functions = array();

        try {
            $this->env->getExtension('sandbox')->checkSecurity(
                array('if', 'block'),
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

        // line 1
        if ($this->getAttribute($this->getAttribute((isset($context["content"]) ? $context["content"] : null), "field_sous_titre", array()), 0, array())) {
            // line 2
            echo "
    ";
            // line 3
            if ($this->getAttribute($this->getAttribute((isset($context["content"]) ? $context["content"] : null), "field_image", array()), 0, array())) {
                // line 4
                echo "        <div id=\"bandeau_visuel\">
            ";
                // line 5
                echo $this->env->getExtension('sandbox')->ensureToStringAllowed($this->env->getExtension('drupal_core')->escapeFilter($this->env, $this->getAttribute($this->getAttribute((isset($context["content"]) ? $context["content"] : null), "field_image", array()), 0, array()), "html", null, true));
                echo "
        </div>
    ";
            }
            // line 8
            echo "    <div id=\"page_deco\">

        <div id=\"avec_nav_sans_encadres\" class=\"contenu\">

            ";
            // line 12
            if ($this->getAttribute($this->getAttribute((isset($context["content"]) ? $context["content"] : null), "field_sous_titre", array()), 0, array())) {
                // line 13
                echo "                <h1>";
                echo $this->env->getExtension('sandbox')->ensureToStringAllowed($this->env->getExtension('drupal_core')->escapeFilter($this->env, $this->getAttribute($this->getAttribute((isset($context["content"]) ? $context["content"] : null), "field_sous_titre", array()), 0, array()), "html", null, true));
                echo "</h1>
            ";
            }
            // line 15
            echo "
            <div>

                <div class=\"ligne_1\">

                    <div class=\"colonne_1\">
                        <div class=\"colonne_deco\">
                            ";
            // line 22
            if ($this->getAttribute($this->getAttribute((isset($context["content"]) ? $context["content"] : null), "field_tite", array()), 0, array())) {
                // line 23
                echo "                                <div class=\"style_1\">
                                    <h2><span>";
                // line 24
                echo $this->env->getExtension('sandbox')->ensureToStringAllowed($this->env->getExtension('drupal_core')->escapeFilter($this->env, $this->getAttribute($this->getAttribute((isset($context["content"]) ? $context["content"] : null), "field_tite", array()), 0, array()), "html", null, true));
                echo "</span></h2>
                                </div><!-- .style_1 -->
                            ";
            }
            // line 27
            echo "                            ";
            if ($this->getAttribute($this->getAttribute((isset($context["content"]) ? $context["content"] : null), "field_colonne_1_1", array()), 0, array())) {
                // line 28
                echo "                                <div class=\"style_4\">
                                    ";
                // line 29
                echo $this->env->getExtension('sandbox')->ensureToStringAllowed($this->env->getExtension('drupal_core')->escapeFilter($this->env, $this->getAttribute($this->getAttribute((isset($context["content"]) ? $context["content"] : null), "field_colonne_1_1", array()), 0, array()), "html", null, true));
                echo "
                                </div><!-- .style_3 -->
                            ";
            }
            // line 32
            echo "                            ";
            if ($this->getAttribute($this->getAttribute((isset($context["content"]) ? $context["content"] : null), "field_aide_colonne1", array()), 0, array())) {
                // line 33
                echo "                                <div class=\"style_3\">
                                    ";
                // line 34
                echo $this->env->getExtension('sandbox')->ensureToStringAllowed($this->env->getExtension('drupal_core')->escapeFilter($this->env, $this->getAttribute($this->getAttribute((isset($context["content"]) ? $context["content"] : null), "field_aide_colonne1", array()), 0, array()), "html", null, true));
                echo "
                                </div><!-- .style_3 -->
                            ";
            }
            // line 37
            echo "                            ";
            if ($this->getAttribute($this->getAttribute((isset($context["content"]) ? $context["content"] : null), "field_tit", array()), 0, array())) {
                // line 38
                echo "                                <div class=\"style_1\">
                                    <h2><span>";
                // line 39
                echo $this->env->getExtension('sandbox')->ensureToStringAllowed($this->env->getExtension('drupal_core')->escapeFilter($this->env, $this->getAttribute($this->getAttribute((isset($context["content"]) ? $context["content"] : null), "field_tit", array()), 0, array()), "html", null, true));
                echo "</span></h2>
                                </div>
                            ";
            }
            // line 42
            echo "                            ";
            if ($this->getAttribute($this->getAttribute((isset($context["content"]) ? $context["content"] : null), "field_colonne", array()), 0, array())) {
                // line 43
                echo "                                <div class=\"style_4\">
                                    ";
                // line 44
                echo $this->env->getExtension('sandbox')->ensureToStringAllowed($this->env->getExtension('drupal_core')->escapeFilter($this->env, $this->getAttribute($this->getAttribute((isset($context["content"]) ? $context["content"] : null), "field_colonne", array()), 0, array()), "html", null, true));
                echo "
                                </div><!-- .style_3 -->
                            ";
            }
            // line 47
            echo "                            ";
            if ($this->getAttribute($this->getAttribute((isset($context["content"]) ? $context["content"] : null), "field_infos_sous_colonne_1", array()), 0, array())) {
                // line 48
                echo "                                <div class=\"style_3\">
                                    ";
                // line 49
                echo $this->env->getExtension('sandbox')->ensureToStringAllowed($this->env->getExtension('drupal_core')->escapeFilter($this->env, $this->getAttribute($this->getAttribute((isset($context["content"]) ? $context["content"] : null), "field_infos_sous_colonne_1", array()), 0, array()), "html", null, true));
                echo "
                                </div><!-- .style_3 -->
                            ";
            }
            // line 52
            echo "
                        </div><!-- colonne_deco -->
                    </div><!-- .colonne_1 -->

                    <div class=\"colonne_2\">
                        <div class=\"colonne_deco\">
                            ";
            // line 58
            if (($this->getAttribute($this->getAttribute((isset($context["content"]) ? $context["content"] : null), "field_titre_colonne_2_1", array()), 0, array()) || $this->getAttribute($this->getAttribute((isset($context["content"]) ? $context["content"] : null), "field_colonne_2_1", array()), 0, array()))) {
                // line 59
                echo "                                <div class=\"style_1\">
                                    ";
                // line 60
                if ($this->getAttribute($this->getAttribute((isset($context["content"]) ? $context["content"] : null), "field_titre_colonne_2_1", array()), 0, array())) {
                    // line 61
                    echo "                                        <h2>";
                    echo $this->env->getExtension('sandbox')->ensureToStringAllowed($this->env->getExtension('drupal_core')->escapeFilter($this->env, $this->getAttribute($this->getAttribute((isset($context["content"]) ? $context["content"] : null), "field_titre_colonne_2_1", array()), 0, array()), "html", null, true));
                    echo "</h2>
                                    ";
                }
                // line 63
                echo "                                    ";
                if ($this->getAttribute($this->getAttribute((isset($context["content"]) ? $context["content"] : null), "field_colonne_2_1", array()), 0, array())) {
                    // line 64
                    echo "                                        <div class=\"toolbox\">
                                            ";
                    // line 65
                    echo $this->env->getExtension('sandbox')->ensureToStringAllowed($this->env->getExtension('drupal_core')->escapeFilter($this->env, $this->getAttribute($this->getAttribute((isset($context["content"]) ? $context["content"] : null), "field_colonne_2_1", array()), 0, array()), "html", null, true));
                    echo "
                                        </div>
                                    ";
                }
                // line 68
                echo "                                </div><!-- .style_1 -->
                            ";
            }
            // line 70
            echo "
                            ";
            // line 71
            if ($this->getAttribute($this->getAttribute((isset($context["content"]) ? $context["content"] : null), "field_info", array()), 0, array())) {
                // line 72
                echo "                                <div class=\"style_3\">
                                    ";
                // line 73
                echo $this->env->getExtension('sandbox')->ensureToStringAllowed($this->env->getExtension('drupal_core')->escapeFilter($this->env, $this->getAttribute($this->getAttribute((isset($context["content"]) ? $context["content"] : null), "field_info", array()), 0, array()), "html", null, true));
                echo "
                                </div><!-- .style_3 -->
                            ";
            }
            // line 76
            echo "                            ";
            if ($this->getAttribute($this->getAttribute((isset($context["content"]) ? $context["content"] : null), "field_u", array()), 0, array())) {
                // line 77
                echo "                                <div class=\"style_1\">

                                    <div class=\"toolbox\">
                                        ";
                // line 80
                echo $this->env->getExtension('sandbox')->ensureToStringAllowed($this->env->getExtension('drupal_core')->escapeFilter($this->env, $this->getAttribute($this->getAttribute((isset($context["content"]) ? $context["content"] : null), "field_u", array()), 0, array()), "html", null, true));
                echo "
                                    </div>
                                </div><!-- .style_1 -->
                            ";
            }
            // line 84
            echo "                            ";
            if ($this->getAttribute($this->getAttribute((isset($context["content"]) ? $context["content"] : null), "field_bloc_texte_colonne_2", array()), 0, array())) {
                // line 85
                echo "                                <div class=\"style_1\">

                                    <div class=\"toolbox\">
                                        ";
                // line 88
                echo $this->env->getExtension('sandbox')->ensureToStringAllowed($this->env->getExtension('drupal_core')->escapeFilter($this->env, $this->getAttribute($this->getAttribute((isset($context["content"]) ? $context["content"] : null), "field_bloc_texte_colonne_2", array()), 0, array()), "html", null, true));
                echo "
                                    </div>
                                </div><!-- .style_1 -->
                            ";
            }
            // line 92
            echo "

                            ";
            // line 94
            if ($this->getAttribute($this->getAttribute((isset($context["content"]) ? $context["content"] : null), "field_in", array()), 0, array())) {
                // line 95
                echo "                                <div class=\"style_3\">
                                    ";
                // line 96
                echo $this->env->getExtension('sandbox')->ensureToStringAllowed($this->env->getExtension('drupal_core')->escapeFilter($this->env, $this->getAttribute($this->getAttribute((isset($context["content"]) ? $context["content"] : null), "field_in", array()), 0, array()), "html", null, true));
                echo "

                                </div><!-- .style_3 --> ";
            }
            // line 99
            echo "

                        </div><!-- colonne_deco -->
                    </div><!-- .colonne_2 -->

                </div><!-- .ligne_1 -->


            </div><!-- / -->


            ";
            // line 110
            if ($this->getAttribute($this->getAttribute((isset($context["content"]) ? $context["content"] : null), "field_file_share", array()), 0, array())) {
                // line 111
                echo "                <div id=\"partage\">
                    <strong class=\"h2\">Partager</strong>
                    <ul id=\"boutons_actions\">
                        <li id=\"partage_pdf\">
                            ";
                // line 115
                echo $this->env->getExtension('sandbox')->ensureToStringAllowed($this->env->getExtension('drupal_core')->escapeFilter($this->env, $this->getAttribute($this->getAttribute((isset($context["content"]) ? $context["content"] : null), "field_file_share", array()), 0, array()), "html", null, true));
                echo "
                        </li>
                    </ul>
                </div><!-- #partage -->
            ";
            }
            // line 120
            echo "
        </div>


        <div id=\"navigation\">

            <div id=\"rubrique_niveau_2\">
                ";
            // line 127
            echo $this->env->getExtension('sandbox')->ensureToStringAllowed($this->env->getExtension('drupal_core')->escapeFilter($this->env, (isset($context["label"]) ? $context["label"] : null), "html", null, true));
            echo "
            </div>

            ";
            // line 130
            if ((($this->getAttribute($this->getAttribute($this->getAttribute((isset($context["content"]) ? $context["content"] : null), "field_afficher_dans_le_bloc_vous", array()), 0, array()), "#markup", array(), "array") == "Activé") && $this->getAttribute($this->getAttribute((isset($context["content"]) ? $context["content"] : null), "field_image_vous_etes_", array()), 0, array()))) {
                // line 131
                echo "                <p>";
                echo $this->env->getExtension('sandbox')->ensureToStringAllowed($this->env->getExtension('drupal_core')->escapeFilter($this->env, $this->getAttribute($this->getAttribute((isset($context["content"]) ? $context["content"] : null), "field_image_vous_etes_", array()), 0, array()), "html", null, true));
                echo " </p>
            ";
            }
            // line 133
            echo "                ";
            // line 134
            echo "                ";
            if ($this->getAttribute((isset($context["page"]) ? $context["page"] : null), "navigationprincipale_2", array())) {
                // line 135
                echo "                    ";
                $this->displayBlock('upjv_menu_n', $context, $blocks);
                // line 140
                echo "                ";
            }
            // line 141
            echo "
        </div>
    </div>
";
        }
    }

    // line 135
    public function block_upjv_menu_n($context, array $blocks = array())
    {
        // line 136
        echo "                        <div class=\"upjv_menu_n container\">
                            ";
        // line 137
        echo $this->env->getExtension('sandbox')->ensureToStringAllowed($this->env->getExtension('drupal_core')->escapeFilter($this->env, $this->getAttribute((isset($context["page"]) ? $context["page"] : null), "navigationprincipale_2", array()), "html", null, true));
        echo "
                        </div>
                    ";
    }

    public function getTemplateName()
    {
        return "themes/upjv/templates/node--deux_col_plus.html.twig";
    }

    public function isTraitable()
    {
        return false;
    }

    public function getDebugInfo()
    {
        return array (  327 => 137,  324 => 136,  321 => 135,  313 => 141,  310 => 140,  307 => 135,  304 => 134,  302 => 133,  296 => 131,  294 => 130,  288 => 127,  279 => 120,  271 => 115,  265 => 111,  263 => 110,  250 => 99,  244 => 96,  241 => 95,  239 => 94,  235 => 92,  228 => 88,  223 => 85,  220 => 84,  213 => 80,  208 => 77,  205 => 76,  199 => 73,  196 => 72,  194 => 71,  191 => 70,  187 => 68,  181 => 65,  178 => 64,  175 => 63,  169 => 61,  167 => 60,  164 => 59,  162 => 58,  154 => 52,  148 => 49,  145 => 48,  142 => 47,  136 => 44,  133 => 43,  130 => 42,  124 => 39,  121 => 38,  118 => 37,  112 => 34,  109 => 33,  106 => 32,  100 => 29,  97 => 28,  94 => 27,  88 => 24,  85 => 23,  83 => 22,  74 => 15,  68 => 13,  66 => 12,  60 => 8,  54 => 5,  51 => 4,  49 => 3,  46 => 2,  44 => 1,);
    }
}
/* {% if content.field_sous_titre.0 %}*/
/* */
/*     {% if content.field_image.0 %}*/
/*         <div id="bandeau_visuel">*/
/*             {{ content.field_image.0 }}*/
/*         </div>*/
/*     {% endif %}*/
/*     <div id="page_deco">*/
/* */
/*         <div id="avec_nav_sans_encadres" class="contenu">*/
/* */
/*             {% if content.field_sous_titre.0 %}*/
/*                 <h1>{{ content.field_sous_titre.0 }}</h1>*/
/*             {% endif %}*/
/* */
/*             <div>*/
/* */
/*                 <div class="ligne_1">*/
/* */
/*                     <div class="colonne_1">*/
/*                         <div class="colonne_deco">*/
/*                             {% if content.field_tite.0 %}*/
/*                                 <div class="style_1">*/
/*                                     <h2><span>{{ content.field_tite.0 }}</span></h2>*/
/*                                 </div><!-- .style_1 -->*/
/*                             {% endif %}*/
/*                             {% if content.field_colonne_1_1.0 %}*/
/*                                 <div class="style_4">*/
/*                                     {{ content.field_colonne_1_1.0 }}*/
/*                                 </div><!-- .style_3 -->*/
/*                             {% endif %}*/
/*                             {% if content.field_aide_colonne1.0 %}*/
/*                                 <div class="style_3">*/
/*                                     {{ content.field_aide_colonne1.0 }}*/
/*                                 </div><!-- .style_3 -->*/
/*                             {% endif %}*/
/*                             {% if content.field_tit.0 %}*/
/*                                 <div class="style_1">*/
/*                                     <h2><span>{{ content.field_tit.0 }}</span></h2>*/
/*                                 </div>*/
/*                             {% endif %}*/
/*                             {% if content.field_colonne.0 %}*/
/*                                 <div class="style_4">*/
/*                                     {{ content.field_colonne.0 }}*/
/*                                 </div><!-- .style_3 -->*/
/*                             {% endif %}*/
/*                             {% if content.field_infos_sous_colonne_1.0 %}*/
/*                                 <div class="style_3">*/
/*                                     {{ content.field_infos_sous_colonne_1.0 }}*/
/*                                 </div><!-- .style_3 -->*/
/*                             {% endif %}*/
/* */
/*                         </div><!-- colonne_deco -->*/
/*                     </div><!-- .colonne_1 -->*/
/* */
/*                     <div class="colonne_2">*/
/*                         <div class="colonne_deco">*/
/*                             {% if content.field_titre_colonne_2_1.0 or content.field_colonne_2_1.0 %}*/
/*                                 <div class="style_1">*/
/*                                     {% if content.field_titre_colonne_2_1.0 %}*/
/*                                         <h2>{{ content.field_titre_colonne_2_1.0 }}</h2>*/
/*                                     {% endif %}*/
/*                                     {% if content.field_colonne_2_1.0 %}*/
/*                                         <div class="toolbox">*/
/*                                             {{ content.field_colonne_2_1.0 }}*/
/*                                         </div>*/
/*                                     {% endif %}*/
/*                                 </div><!-- .style_1 -->*/
/*                             {% endif %}*/
/* */
/*                             {% if content.field_info.0 %}*/
/*                                 <div class="style_3">*/
/*                                     {{ content.field_info.0 }}*/
/*                                 </div><!-- .style_3 -->*/
/*                             {% endif %}*/
/*                             {% if content.field_u.0 %}*/
/*                                 <div class="style_1">*/
/* */
/*                                     <div class="toolbox">*/
/*                                         {{ content.field_u.0 }}*/
/*                                     </div>*/
/*                                 </div><!-- .style_1 -->*/
/*                             {% endif %}*/
/*                             {% if content.field_bloc_texte_colonne_2.0 %}*/
/*                                 <div class="style_1">*/
/* */
/*                                     <div class="toolbox">*/
/*                                         {{ content.field_bloc_texte_colonne_2.0 }}*/
/*                                     </div>*/
/*                                 </div><!-- .style_1 -->*/
/*                             {% endif %}*/
/* */
/* */
/*                             {% if content.field_in.0 %}*/
/*                                 <div class="style_3">*/
/*                                     {{ content.field_in.0 }}*/
/* */
/*                                 </div><!-- .style_3 --> {% endif %}*/
/* */
/* */
/*                         </div><!-- colonne_deco -->*/
/*                     </div><!-- .colonne_2 -->*/
/* */
/*                 </div><!-- .ligne_1 -->*/
/* */
/* */
/*             </div><!-- / -->*/
/* */
/* */
/*             {% if content.field_file_share.0 %}*/
/*                 <div id="partage">*/
/*                     <strong class="h2">Partager</strong>*/
/*                     <ul id="boutons_actions">*/
/*                         <li id="partage_pdf">*/
/*                             {{ content.field_file_share.0 }}*/
/*                         </li>*/
/*                     </ul>*/
/*                 </div><!-- #partage -->*/
/*             {% endif %}*/
/* */
/*         </div>*/
/* */
/* */
/*         <div id="navigation">*/
/* */
/*             <div id="rubrique_niveau_2">*/
/*                 {{ label }}*/
/*             </div>*/
/* */
/*             {% if content.field_afficher_dans_le_bloc_vous.0['#markup'] == "Activé" and content.field_image_vous_etes_.0 %}*/
/*                 <p>{{ content.field_image_vous_etes_.0 }} </p>*/
/*             {% endif %}*/
/*                 {# block upjv_menu_n #}*/
/*                 {% if page.navigationprincipale_2 %}*/
/*                     {% block upjv_menu_n %}*/
/*                         <div class="upjv_menu_n container">*/
/*                             {{ page.navigationprincipale_2 }}*/
/*                         </div>*/
/*                     {% endblock %}*/
/*                 {% endif %}*/
/* */
/*         </div>*/
/*     </div>*/
/* {% endif %}*/

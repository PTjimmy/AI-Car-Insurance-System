--
-- PostgreSQL database dump
--

\restrict np83gzsd7h9EGhieHPjcjvVJoWzvzmu3kOUSpaxBwlZRvni54RNZtXy6Y7LAjNS

-- Dumped from database version 18.4 (Debian 18.4-1.pgdg13+1)
-- Dumped by pg_dump version 18.6

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: ai_analysis; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.ai_analysis (
    analysis_id bigint NOT NULL,
    claim_id bigint NOT NULL,
    damage_severity character varying(50),
    confidence_score numeric(5,4),
    estimated_repair_cost numeric(12,2),
    risk_level character varying(30),
    fraud_score numeric(5,4),
    model_version character varying(50),
    analyzed_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.ai_analysis OWNER TO postgres;

--
-- Name: ai_analysis_analysis_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.ai_analysis ALTER COLUMN analysis_id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.ai_analysis_analysis_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: claim; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.claim (
    claim_id bigint NOT NULL,
    claim_number character varying(30) NOT NULL,
    policy_id bigint NOT NULL,
    accident_date date NOT NULL,
    claim_date timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    description text NOT NULL,
    claimed_amount numeric(12,2) NOT NULL,
    approved_amount numeric(12,2),
    status character varying(20) NOT NULL,
    decision_remarks text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.claim OWNER TO postgres;

--
-- Name: claim_claim_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.claim ALTER COLUMN claim_id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.claim_claim_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: claim_history; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.claim_history (
    history_id bigint NOT NULL,
    claim_id bigint NOT NULL,
    officer_id bigint NOT NULL,
    status character varying(20) NOT NULL,
    remarks text,
    changed_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.claim_history OWNER TO postgres;

--
-- Name: claim_history_history_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.claim_history ALTER COLUMN history_id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.claim_history_history_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: claim_image; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.claim_image (
    image_id bigint NOT NULL,
    claim_id bigint NOT NULL,
    file_path text NOT NULL,
    image_type character varying(50) NOT NULL,
    uploaded_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.claim_image OWNER TO postgres;

--
-- Name: claim_image_image_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.claim_image ALTER COLUMN image_id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.claim_image_image_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: claim_officer; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.claim_officer (
    officer_id bigint NOT NULL,
    first_name character varying(50) NOT NULL,
    last_name character varying(50) NOT NULL,
    email character varying(100) NOT NULL,
    phone character varying(20),
    status character varying(20) NOT NULL
);


ALTER TABLE public.claim_officer OWNER TO postgres;

--
-- Name: claim_officer_officer_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.claim_officer ALTER COLUMN officer_id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.claim_officer_officer_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: coverage_type; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.coverage_type (
    coverage_type_id bigint NOT NULL,
    coverage_name character varying(100) NOT NULL,
    description text,
    is_active boolean DEFAULT true NOT NULL
);


ALTER TABLE public.coverage_type OWNER TO postgres;

--
-- Name: coverage_type_coverage_type_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.coverage_type ALTER COLUMN coverage_type_id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.coverage_type_coverage_type_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: customer; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.customer (
    customer_id bigint NOT NULL,
    first_name character varying(50) NOT NULL,
    last_name character varying(50) NOT NULL,
    email character varying(100) NOT NULL,
    phone character varying(20) NOT NULL,
    password_hash character varying(255) NOT NULL,
    address text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    status character varying(20) NOT NULL
);


ALTER TABLE public.customer OWNER TO postgres;

--
-- Name: customer_customer_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.customer ALTER COLUMN customer_id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.customer_customer_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: policy; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.policy (
    policy_id bigint NOT NULL,
    policy_number character varying(30) NOT NULL,
    vehicle_id bigint NOT NULL,
    policy_type_id bigint NOT NULL,
    start_date date NOT NULL,
    end_date date NOT NULL,
    status character varying(20) NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.policy OWNER TO postgres;

--
-- Name: policy_coverage; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.policy_coverage (
    policy_type_id bigint NOT NULL,
    coverage_type_id bigint NOT NULL
);


ALTER TABLE public.policy_coverage OWNER TO postgres;

--
-- Name: policy_policy_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.policy ALTER COLUMN policy_id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.policy_policy_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: policy_type; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.policy_type (
    policy_type_id bigint NOT NULL,
    policy_name character varying(100) NOT NULL,
    annual_premium numeric(12,2) NOT NULL,
    coverage_limit numeric(12,2) NOT NULL,
    description text,
    is_active boolean DEFAULT true NOT NULL
);


ALTER TABLE public.policy_type OWNER TO postgres;

--
-- Name: policy_type_policy_type_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.policy_type ALTER COLUMN policy_type_id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.policy_type_policy_type_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: vehicle; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.vehicle (
    vehicle_id bigint NOT NULL,
    customer_id bigint NOT NULL,
    registration_number character varying(20) NOT NULL,
    make character varying(50) NOT NULL,
    model character varying(50) NOT NULL,
    manufacturing_year smallint NOT NULL,
    vehicle_value numeric(12,2) NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.vehicle OWNER TO postgres;

--
-- Name: vehicle_vehicle_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.vehicle ALTER COLUMN vehicle_id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.vehicle_vehicle_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: ai_analysis ai_analysis_claim_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ai_analysis
    ADD CONSTRAINT ai_analysis_claim_id_key UNIQUE (claim_id);


--
-- Name: ai_analysis ai_analysis_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ai_analysis
    ADD CONSTRAINT ai_analysis_pkey PRIMARY KEY (analysis_id);


--
-- Name: claim claim_claim_number_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.claim
    ADD CONSTRAINT claim_claim_number_key UNIQUE (claim_number);


--
-- Name: claim_history claim_history_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.claim_history
    ADD CONSTRAINT claim_history_pkey PRIMARY KEY (history_id);


--
-- Name: claim_image claim_image_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.claim_image
    ADD CONSTRAINT claim_image_pkey PRIMARY KEY (image_id);


--
-- Name: claim_officer claim_officer_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.claim_officer
    ADD CONSTRAINT claim_officer_email_key UNIQUE (email);


--
-- Name: claim_officer claim_officer_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.claim_officer
    ADD CONSTRAINT claim_officer_pkey PRIMARY KEY (officer_id);


--
-- Name: claim claim_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.claim
    ADD CONSTRAINT claim_pkey PRIMARY KEY (claim_id);


--
-- Name: coverage_type coverage_type_coverage_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.coverage_type
    ADD CONSTRAINT coverage_type_coverage_name_key UNIQUE (coverage_name);


--
-- Name: coverage_type coverage_type_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.coverage_type
    ADD CONSTRAINT coverage_type_pkey PRIMARY KEY (coverage_type_id);


--
-- Name: customer customer_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.customer
    ADD CONSTRAINT customer_email_key UNIQUE (email);


--
-- Name: customer customer_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.customer
    ADD CONSTRAINT customer_pkey PRIMARY KEY (customer_id);


--
-- Name: policy_coverage pk_policy_coverage; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.policy_coverage
    ADD CONSTRAINT pk_policy_coverage PRIMARY KEY (policy_type_id, coverage_type_id);


--
-- Name: policy policy_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.policy
    ADD CONSTRAINT policy_pkey PRIMARY KEY (policy_id);


--
-- Name: policy policy_policy_number_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.policy
    ADD CONSTRAINT policy_policy_number_key UNIQUE (policy_number);


--
-- Name: policy_type policy_type_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.policy_type
    ADD CONSTRAINT policy_type_pkey PRIMARY KEY (policy_type_id);


--
-- Name: policy_type policy_type_policy_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.policy_type
    ADD CONSTRAINT policy_type_policy_name_key UNIQUE (policy_name);


--
-- Name: vehicle vehicle_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.vehicle
    ADD CONSTRAINT vehicle_pkey PRIMARY KEY (vehicle_id);


--
-- Name: vehicle vehicle_registration_number_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.vehicle
    ADD CONSTRAINT vehicle_registration_number_key UNIQUE (registration_number);


--
-- Name: ai_analysis fk_ai_analysis_claim; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ai_analysis
    ADD CONSTRAINT fk_ai_analysis_claim FOREIGN KEY (claim_id) REFERENCES public.claim(claim_id);


--
-- Name: claim_history fk_claim_history_claim; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.claim_history
    ADD CONSTRAINT fk_claim_history_claim FOREIGN KEY (claim_id) REFERENCES public.claim(claim_id);


--
-- Name: claim_history fk_claim_history_officer; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.claim_history
    ADD CONSTRAINT fk_claim_history_officer FOREIGN KEY (officer_id) REFERENCES public.claim_officer(officer_id);


--
-- Name: claim_image fk_claim_image_claim; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.claim_image
    ADD CONSTRAINT fk_claim_image_claim FOREIGN KEY (claim_id) REFERENCES public.claim(claim_id);


--
-- Name: claim fk_claim_policy; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.claim
    ADD CONSTRAINT fk_claim_policy FOREIGN KEY (policy_id) REFERENCES public.policy(policy_id);


--
-- Name: policy_coverage fk_policy_coverage_coverage_type; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.policy_coverage
    ADD CONSTRAINT fk_policy_coverage_coverage_type FOREIGN KEY (coverage_type_id) REFERENCES public.coverage_type(coverage_type_id);


--
-- Name: policy_coverage fk_policy_coverage_policy_type; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.policy_coverage
    ADD CONSTRAINT fk_policy_coverage_policy_type FOREIGN KEY (policy_type_id) REFERENCES public.policy_type(policy_type_id);


--
-- Name: policy fk_policy_policy_type; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.policy
    ADD CONSTRAINT fk_policy_policy_type FOREIGN KEY (policy_type_id) REFERENCES public.policy_type(policy_type_id);


--
-- Name: policy fk_policy_vehicle; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.policy
    ADD CONSTRAINT fk_policy_vehicle FOREIGN KEY (vehicle_id) REFERENCES public.vehicle(vehicle_id);


--
-- Name: vehicle fk_vehicle_customer; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.vehicle
    ADD CONSTRAINT fk_vehicle_customer FOREIGN KEY (customer_id) REFERENCES public.customer(customer_id);


--
-- PostgreSQL database dump complete
--

\unrestrict np83gzsd7h9EGhieHPjcjvVJoWzvzmu3kOUSpaxBwlZRvni54RNZtXy6Y7LAjNS

